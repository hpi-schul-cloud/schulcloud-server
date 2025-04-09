import { ErrorUtils } from '@core/error/utils';
import { LegacyLogger } from '@core/logger';
import { AntivirusService } from '@infra/antivirus';
import { S3ClientAdapter } from '@infra/s3-client';
import {
	BadRequestException,
	ConflictException,
	Inject,
	Injectable,
	NotAcceptableException,
	NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Counted, EntityId } from '@shared/domain/types';
import FileType from 'file-type-cjs/file-type-cjs-index';
import { PassThrough, Readable } from 'stream';
import {
	CopyFileResponse,
	CopyFilesOfParentParams,
	DownloadFileParams,
	FileRecordParams,
	RenameFileParams,
	ScanResultParams,
	SingleFileParams,
} from '../../api/dto'; // TODO: invalid import
import { FILES_STORAGE_S3_CONNECTION, FileStorageConfig } from '../../files-storage.config';
import { CopyFileResponseBuilder, FileRecordMapper, FileResponseBuilder, FilesStorageMapper } from '../../mapper';
import { FileRecordEntity, ScanStatus } from '../../repo';
import { FileDto } from '../dto';
import { ErrorType } from '../error';
import {
	createCopyFiles,
	createFileRecord,
	createPath,
	getPaths,
	markForDelete,
	resolveFileNameDuplicates,
	unmarkForDelete,
} from '../helper';
import { FILE_RECORD_REPO, FileRecordRepo, GetFileResponse, StorageLocationParams } from '../interface';

@Injectable()
export class FilesStorageService {
	constructor(
		@Inject(FILE_RECORD_REPO) private readonly fileRecordRepo: FileRecordRepo,
		@Inject(FILES_STORAGE_S3_CONNECTION) private readonly storageClient: S3ClientAdapter,
		private readonly antivirusService: AntivirusService,
		private readonly configService: ConfigService<FileStorageConfig, true>,
		private logger: LegacyLogger
	) {
		this.logger.setContext(FilesStorageService.name);
	}

	// find
	public async getFileRecord(params: SingleFileParams): Promise<FileRecordEntity> {
		const fileRecord = await this.fileRecordRepo.findOneById(params.fileRecordId);

		return fileRecord;
	}

	public async getFileRecordBySecurityCheckRequestToken(token: string): Promise<FileRecordEntity> {
		const fileRecord = await this.fileRecordRepo.findBySecurityCheckRequestToken(token);

		return fileRecord;
	}

	public async getFileRecordMarkedForDelete(params: SingleFileParams): Promise<FileRecordEntity> {
		const fileRecord = await this.fileRecordRepo.findOneByIdMarkedForDelete(params.fileRecordId);

		return fileRecord;
	}

	public async getFileRecordsOfParent(parentId: EntityId): Promise<Counted<FileRecordEntity[]>> {
		const countedFileRecords = await this.fileRecordRepo.findByParentId(parentId);

		return countedFileRecords;
	}

	public async getFileRecordsByCreatorId(creatorId: EntityId): Promise<Counted<FileRecordEntity[]>> {
		const countedFileRecords = await this.fileRecordRepo.findByCreatorId(creatorId);

		return countedFileRecords;
	}

	// upload
	public async uploadFile(userId: EntityId, params: FileRecordParams, file: FileDto): Promise<FileRecordEntity> {
		const { fileRecord, stream } = await this.createFileRecord(file, params, userId);
		// MimeType Detection consumes part of the stream, so the restored stream is passed on
		file.data = stream;
		file.mimeType = fileRecord.mimeType;
		await this.fileRecordRepo.save(fileRecord);

		await this.createFileInStorageAndRollbackOnError(fileRecord, params, file);

		return fileRecord;
	}

	private async createFileRecord(
		file: FileDto,
		params: FileRecordParams,
		userId: EntityId
	): Promise<{ fileRecord: FileRecordEntity; stream: Readable }> {
		const fileName = await this.resolveFileName(file, params);
		const { mimeType, stream } = await this.detectMimeType(file);

		// Create fileRecord with 0 as initial file size, because it is overwritten later anyway.
		const fileRecord = createFileRecord(fileName, 0, mimeType, params, userId);

		return { fileRecord, stream };
	}

	private async detectMimeType(file: FileDto): Promise<{ mimeType: string; stream: Readable }> {
		if (this.isStreamMimeTypeDetectionPossible(file.mimeType)) {
			const source = file.data.pipe(new PassThrough());
			const { stream, mime: detectedMimeType } = await this.detectMimeTypeByStream(source);

			const mimeType = detectedMimeType ?? file.mimeType;

			return { mimeType, stream };
		}

		return { mimeType: file.mimeType, stream: file.data };
	}

	private isStreamMimeTypeDetectionPossible(mimeType: string): boolean {
		const mimTypes = [
			'text/csv',
			'image/svg+xml',
			'application/msword',
			'application/vnd.ms-powerpoint',
			'application/vnd.ms-excel',
		];

		const result = !mimTypes.includes(mimeType);

		return result;
	}

	private async detectMimeTypeByStream(file: Readable): Promise<{ mime?: string; stream: Readable }> {
		const stream = await FileType.fileTypeStream(file);

		return { mime: stream.fileType?.mime, stream };
	}

	private async resolveFileName(file: FileDto, params: FileRecordParams): Promise<string> {
		let fileName = file.name;

		const [fileRecordsOfParent, count] = await this.getFileRecordsOfParent(params.parentId);
		if (count > 0) {
			fileName = resolveFileNameDuplicates(file.name, fileRecordsOfParent);
		}

		return fileName;
	}

	private async createFileInStorageAndRollbackOnError(
		fileRecord: FileRecordEntity,
		params: FileRecordParams,
		file: FileDto
	): Promise<void> {
		const filePath = createPath(params.storageLocationId, fileRecord.id);
		const useStreamToAntivirus = this.configService.get<boolean>('USE_STREAM_TO_ANTIVIRUS');

		try {
			const fileSizePromise = this.countFileSize(file);

			if (useStreamToAntivirus && fileRecord.isPreviewPossible()) {
				const streamToAntivirus = file.data.pipe(new PassThrough());

				const [, antivirusClientResponse] = await Promise.all([
					this.storageClient.create(filePath, file),
					this.antivirusService.checkStream(streamToAntivirus),
				]);
				const { status, reason } = FileRecordMapper.mapScanResultParamsToDto(antivirusClientResponse);
				fileRecord.updateSecurityCheckStatus(status, reason);
			} else {
				await this.storageClient.create(filePath, file);
			}

			// The actual file size is set here because it is known only after the whole file is streamed.
			fileRecord.size = await fileSizePromise;
			this.throwErrorIfFileIsTooBig(fileRecord.size);

			fileRecord.markAsUploaded();

			await this.fileRecordRepo.save(fileRecord);

			if (!useStreamToAntivirus || !fileRecord.isPreviewPossible()) {
				await this.sendToAntivirus(fileRecord);
			}
		} catch (error) {
			await this.storageClient.delete([filePath]);
			await this.fileRecordRepo.delete(fileRecord);
			throw error;
		}
	}

	private countFileSize(file: FileDto): Promise<number> {
		const promise = new Promise<number>((resolve) => {
			let fileSize = 0;

			file.data.on('data', (chunk: Buffer) => {
				fileSize += chunk.length;
			});

			file.data.on('end', () => resolve(fileSize));
		});

		return promise;
	}

	private async sendToAntivirus(fileRecord: FileRecordEntity): Promise<void> {
		const maxSecurityCheckFileSize = this.configService.get<number>('MAX_SECURITY_CHECK_FILE_SIZE');

		if (fileRecord.size > maxSecurityCheckFileSize) {
			fileRecord.updateSecurityCheckStatus(ScanStatus.WONT_CHECK, 'File is too big');
			await this.fileRecordRepo.save(fileRecord);
		} else {
			await this.antivirusService.send(fileRecord.getSecurityToken());
		}
	}

	public getMaxFileSize(): number {
		const maxFileSize = this.configService.get<number>('MAX_FILE_SIZE');

		return maxFileSize;
	}

	private throwErrorIfFileIsTooBig(fileSize: number): void {
		if (fileSize > this.getMaxFileSize()) {
			throw new BadRequestException(ErrorType.FILE_TOO_BIG);
		}
	}

	// update
	private checkDuplicatedNames(fileRecords: FileRecordEntity[], newFileName: string): void {
		if (fileRecords.find((item) => item.hasName(newFileName))) {
			throw new ConflictException(ErrorType.FILE_NAME_EXISTS);
		}
	}

	public async patchFilename(fileRecord: FileRecordEntity, data: RenameFileParams): Promise<FileRecordEntity> {
		const fileRecordParams = FilesStorageMapper.mapFileRecordToFileRecordParams(fileRecord);
		const [fileRecords] = await this.getFileRecordsOfParent(fileRecordParams.parentId);

		this.checkDuplicatedNames(fileRecords, data.fileName);
		fileRecord.setName(data.fileName);
		await this.fileRecordRepo.save(fileRecord);

		return fileRecord;
	}

	public async updateSecurityStatus(token: string, scanResultParams: ScanResultParams): Promise<void> {
		const fileRecord = await this.fileRecordRepo.findBySecurityCheckRequestToken(token);

		const { status, reason } = FileRecordMapper.mapScanResultParamsToDto(scanResultParams);
		fileRecord.updateSecurityCheckStatus(status, reason);

		await this.fileRecordRepo.save(fileRecord);
	}

	// download
	public checkFileName(fileRecord: FileRecordEntity, params: DownloadFileParams): void | NotFoundException {
		if (!fileRecord.hasName(params.fileName)) {
			this.logger.debug(`could not find file with id: ${fileRecord.id} by filename`);
			throw new NotFoundException(ErrorType.FILE_NOT_FOUND);
		}
	}

	private checkScanStatus(fileRecord: FileRecordEntity): void | NotAcceptableException {
		if (fileRecord.isBlocked()) {
			this.logger.warn(`file is blocked with id: ${fileRecord.id}`);
			throw new NotAcceptableException(ErrorType.FILE_IS_BLOCKED);
		}
	}

	public async downloadFile(fileRecord: FileRecordEntity, bytesRange?: string): Promise<GetFileResponse> {
		const pathToFile = createPath(fileRecord.storageLocationId, fileRecord.id);
		const file = await this.storageClient.get(pathToFile, bytesRange);
		const response = FileResponseBuilder.build(file, fileRecord.getName());

		return response;
	}

	public async download(
		fileRecord: FileRecordEntity,
		params: DownloadFileParams,
		bytesRange?: string
	): Promise<GetFileResponse> {
		this.checkFileName(fileRecord, params);
		this.checkScanStatus(fileRecord);

		const response = await this.downloadFile(fileRecord, bytesRange);

		return response;
	}

	// delete
	private async deleteFilesInFilesStorageClient(fileRecords: FileRecordEntity[]): Promise<void> {
		const paths = getPaths(fileRecords);

		await this.storageClient.moveToTrash(paths);
	}

	private async deleteWithRollbackByError(fileRecords: FileRecordEntity[]): Promise<void> {
		try {
			await this.deleteFilesInFilesStorageClient(fileRecords);
		} catch (error) {
			await this.fileRecordRepo.save(fileRecords);
			throw error;
		}
	}

	public async delete(fileRecords: FileRecordEntity[]): Promise<void> {
		this.logger.debug({ action: 'delete', fileRecords });

		const markedFileRecords = markForDelete(fileRecords);
		await this.fileRecordRepo.save(markedFileRecords);

		await this.deleteWithRollbackByError(fileRecords);
	}

	public async deleteFilesOfParent(fileRecords: FileRecordEntity[]): Promise<void> {
		if (fileRecords.length > 0) {
			await this.delete(fileRecords);
		}
	}

	public async removeCreatorIdFromFileRecords(fileRecords: FileRecordEntity[]): Promise<FileRecordEntity[]> {
		fileRecords.forEach((entity: FileRecordEntity) => entity.removeCreatorId());
		await this.fileRecordRepo.save(fileRecords);

		return fileRecords;
	}

	public async markForDeleteByStorageLocation(params: StorageLocationParams): Promise<number> {
		const { storageLocation, storageLocationId } = params;
		const result = await this.fileRecordRepo.markForDeleteByStorageLocation(storageLocation, storageLocationId);

		this.storageClient.moveDirectoryToTrash(storageLocationId).catch((error) => {
			this.logger.error(
				{
					message: 'Error while moving directory to trash',
					action: 'markForDeleteByStorageLocation',
					storageLocation,
					storageLocationId,
				},
				ErrorUtils.createHttpExceptionOptions(error)
			);
		});

		return result;
	}

	// restore
	private async restoreFilesInFileStorageClient(fileRecords: FileRecordEntity[]): Promise<void> {
		const paths = getPaths(fileRecords);

		await this.storageClient.restore(paths);
	}

	private async restoreWithRollbackByError(fileRecords: FileRecordEntity[]): Promise<void> {
		try {
			await this.restoreFilesInFileStorageClient(fileRecords);
		} catch (err) {
			markForDelete(fileRecords);
			await this.fileRecordRepo.save(fileRecords);
			throw err;
		}
	}

	public async restoreFilesOfParent(params: FileRecordParams): Promise<Counted<FileRecordEntity[]>> {
		const [fileRecords, count] = await this.fileRecordRepo.findByStorageLocationIdAndParentIdAndMarkedForDelete(
			params.storageLocation,
			params.storageLocationId,
			params.parentId
		);

		if (count > 0) {
			await this.restore(fileRecords);
		}
		return [fileRecords, count];
	}

	public async restore(fileRecords: FileRecordEntity[]): Promise<void> {
		this.logger.debug({ action: 'restore', fileRecords });

		const unmarkFileRecords = unmarkForDelete(fileRecords);
		await this.fileRecordRepo.save(unmarkFileRecords);

		await this.restoreWithRollbackByError(fileRecords);
	}

	// copy
	public async copyFilesOfParent(
		userId: string,
		params: FileRecordParams,
		copyFilesParams: CopyFilesOfParentParams
	): Promise<Counted<CopyFileResponse[]>> {
		const [fileRecords, count] = await this.fileRecordRepo.findByStorageLocationIdAndParentId(
			params.storageLocation,
			params.storageLocationId,
			params.parentId
		);

		if (count === 0) {
			return [[], 0];
		}

		const response = await this.copy(userId, fileRecords, copyFilesParams.target);

		return [response, count];
	}

	private async copyFileRecord(
		sourceFile: FileRecordEntity,
		targetParams: FileRecordParams,
		userId: EntityId
	): Promise<FileRecordEntity> {
		const fileRecord = sourceFile.copy(userId, targetParams);
		await this.fileRecordRepo.save(fileRecord);

		return fileRecord;
	}

	private async sendToAntiVirusService(fileRecord: FileRecordEntity): Promise<void> {
		if (fileRecord.isPending()) {
			await this.antivirusService.send(fileRecord.getSecurityToken());
		}
	}

	private async copyFilesWithRollbackOnError(
		sourceFile: FileRecordEntity,
		targetFile: FileRecordEntity
	): Promise<CopyFileResponse> {
		try {
			const paths = createCopyFiles(sourceFile, targetFile);

			await this.storageClient.copy([paths]);
			await this.sendToAntiVirusService(targetFile);
			const copyFileResponse = CopyFileResponseBuilder.build(targetFile.id, sourceFile.id, targetFile.getName());

			return copyFileResponse;
		} catch (error) {
			await this.fileRecordRepo.delete([targetFile]);
			throw error;
		}
	}

	public async copy(
		userId: EntityId,
		sourceFileRecords: FileRecordEntity[],
		targetParams: FileRecordParams
	): Promise<CopyFileResponse[]> {
		this.logger.debug({ action: 'copy', sourceFileRecords, targetParams });

		const promises: Promise<CopyFileResponse>[] = sourceFileRecords.map(async (sourceFile) => {
			try {
				this.checkScanStatus(sourceFile);

				const targetFile = await this.copyFileRecord(sourceFile, targetParams, userId);
				const fileResponse = await this.copyFilesWithRollbackOnError(sourceFile, targetFile);

				return fileResponse;
			} catch (error) {
				this.logger.error(`copy file failed for source fileRecordId ${sourceFile.id}`, error);

				return {
					sourceId: sourceFile.id,
					name: sourceFile.getName(),
				};
			}
		});

		const settledPromises = await Promise.all(promises);

		return settledPromises;
	}
}
