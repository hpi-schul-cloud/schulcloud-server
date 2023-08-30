import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotAcceptableException,
	NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Counted, EntityId } from '@shared/domain';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { LegacyLogger } from '@src/core/logger';
import { Readable } from 'stream';
import StreamMimeType from 'stream-mime-type-cjs/stream-mime-type-cjs-index';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import {
	CopyFileResponse,
	CopyFilesOfParentParams,
	DownloadFileParams,
	FileRecordParams,
	RenameFileParams,
	ScanResultParams,
	SingleFileParams,
} from '../controller/dto';
import { FileDto } from '../dto';
import { FileRecord, ScanStatus } from '../entity';
import { ErrorType } from '../error';
import { IFileStorageConfig } from '../files-storage.config';
import {
	createFileRecord,
	createICopyFiles,
	createPath,
	getPaths,
	markForDelete,
	resolveFileNameDuplicates,
	unmarkForDelete,
} from '../helper';
import { IGetFile, IGetFileResponse } from '../interface';
import { CopyFileResponseBuilder, FileRecordMapper, FileResponseBuilder, FilesStorageMapper } from '../mapper';
import { FileRecordRepo } from '../repo';

@Injectable()
export class FilesStorageService {
	constructor(
		private readonly fileRecordRepo: FileRecordRepo,
		private readonly storageClient: S3ClientAdapter,
		private readonly antivirusService: AntivirusService,
		private readonly configService: ConfigService<IFileStorageConfig, true>,
		private logger: LegacyLogger
	) {
		this.logger.setContext(FilesStorageService.name);
	}

	// find
	public async getFileRecord(params: SingleFileParams): Promise<FileRecord> {
		const fileRecord = await this.fileRecordRepo.findOneById(params.fileRecordId);

		return fileRecord;
	}

	public async getFileRecordBySecurityCheckRequestToken(token: string): Promise<FileRecord> {
		const fileRecord = await this.fileRecordRepo.findBySecurityCheckRequestToken(token);

		return fileRecord;
	}

	public async getFileRecordMarkedForDelete(params: SingleFileParams) {
		const fileRecord = await this.fileRecordRepo.findOneByIdMarkedForDelete(params.fileRecordId);

		return fileRecord;
	}

	public async getFileRecordsOfParent(parentId: EntityId): Promise<Counted<FileRecord[]>> {
		const countedFileRecords = await this.fileRecordRepo.findByParentId(parentId);

		return countedFileRecords;
	}

	// upload
	public async uploadFile(userId: EntityId, params: FileRecordParams, file: FileDto): Promise<FileRecord> {
		const { fileRecord, stream } = await this.createFileRecord(file, params, userId);
		// MimeType Detection consumes part of the stream, so the restored stream is passed on
		file.data = stream;
		await this.fileRecordRepo.save(fileRecord);

		await this.createFileInStorageAndRollbackOnError(fileRecord, params, file);

		return fileRecord;
	}

	private async createFileRecord(
		file: FileDto,
		params: FileRecordParams,
		userId: EntityId
	): Promise<{ fileRecord: FileRecord; stream: Readable }> {
		const fileName = await this.resolveFileName(file, params);
		const { mimeType, stream } = await this.detectMimeType(file);

		// Create fileRecord with 0 as initial file size, because it is overwritten later anyway.
		const fileRecord = createFileRecord(fileName, 0, mimeType, params, userId);

		return { fileRecord, stream };
	}

	private async detectMimeType(file: FileDto): Promise<{ mimeType: string; stream: Readable }> {
		if (this.isStreamMimeTypeDetectionPossible(file.mimeType)) {
			const { stream, mime: detectedMimeType } = await this.detectMimeTypeByStream(file.data);

			const mimeType = detectedMimeType ?? file.mimeType;

			return { mimeType, stream };
		}

		return { mimeType: file.mimeType, stream: file.data };
	}

	private isStreamMimeTypeDetectionPossible(mimeType: string) {
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
		const { stream, mime } = await StreamMimeType.getMimeType(file, {
			strict: true,
		});
		const readable = new Readable().wrap(stream);

		return { mime, stream: readable };
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
		fileRecord: FileRecord,
		params: FileRecordParams,
		file: FileDto
	): Promise<void> {
		const filePath = createPath(params.schoolId, fileRecord.id);

		try {
			const fileSizePromise = this.countFileSize(file);

			await this.storageClient.create(filePath, file);

			// The actual file size is set here because it is known only after the whole file is streamed.
			fileRecord.size = await fileSizePromise;
			this.throwErrorIfFileIsTooBig(fileRecord.size);
			await this.fileRecordRepo.save(fileRecord);

			await this.sendToAntivirus(fileRecord);
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

	private async sendToAntivirus(fileRecord: FileRecord): Promise<void> {
		const maxSecurityCheckFileSize = this.configService.get<number>('MAX_SECURITY_CHECK_FILE_SIZE');

		if (fileRecord.size > maxSecurityCheckFileSize) {
			fileRecord.updateSecurityCheckStatus(ScanStatus.WONT_CHECK, 'File is too big');
			await this.fileRecordRepo.save(fileRecord);
		} else {
			this.antivirusService.send(fileRecord.getSecurityToken());
		}
	}

	private throwErrorIfFileIsTooBig(fileSize: number): void {
		if (fileSize > this.configService.get<number>('MAX_FILE_SIZE')) {
			throw new BadRequestException(ErrorType.FILE_TOO_BIG);
		}
	}

	// update
	private checkDuplicatedNames(fileRecords: FileRecord[], newFileName: string): void {
		if (fileRecords.find((item) => item.hasName(newFileName))) {
			throw new ConflictException(ErrorType.FILE_NAME_EXISTS);
		}
	}

	public async patchFilename(fileRecord: FileRecord, data: RenameFileParams) {
		const fileRecordParams = FilesStorageMapper.mapFileRecordToFileRecordParams(fileRecord);
		const [fileRecords] = await this.getFileRecordsOfParent(fileRecordParams.parentId);

		this.checkDuplicatedNames(fileRecords, data.fileName);
		fileRecord.setName(data.fileName);
		await this.fileRecordRepo.save(fileRecord);

		return fileRecord;
	}

	public async updateSecurityStatus(token: string, scanResultParams: ScanResultParams) {
		const fileRecord = await this.fileRecordRepo.findBySecurityCheckRequestToken(token);

		const { status, reason } = FileRecordMapper.mapScanResultParamsToDto(scanResultParams);
		fileRecord.updateSecurityCheckStatus(status, reason);

		await this.fileRecordRepo.save(fileRecord);
	}

	// download
	private checkFileName(fileRecord: FileRecord, params: DownloadFileParams): void | NotFoundException {
		if (!fileRecord.hasName(params.fileName)) {
			this.logger.debug(`could not find file with id: ${fileRecord.id} by filename`);
			throw new NotFoundException(ErrorType.FILE_NOT_FOUND);
		}
	}

	private checkScanStatus(fileRecord: FileRecord): void | NotAcceptableException {
		if (fileRecord.isBlocked()) {
			this.logger.warn(`file is blocked with id: ${fileRecord.id}`);
			throw new NotAcceptableException(ErrorType.FILE_IS_BLOCKED);
		}
	}

	public async downloadFile(schoolId: EntityId, fileRecordId: EntityId, bytesRange?: string): Promise<IGetFile> {
		const pathToFile = createPath(schoolId, fileRecordId);
		const response = await this.storageClient.get(pathToFile, bytesRange);

		return response;
	}

	public async download(
		fileRecord: FileRecord,
		params: DownloadFileParams,
		bytesRange?: string
	): Promise<IGetFileResponse> {
		this.checkFileName(fileRecord, params);
		this.checkScanStatus(fileRecord);

		const file = await this.downloadFile(fileRecord.getSchoolId(), fileRecord.id, bytesRange);
		const response = FileResponseBuilder.build(file, fileRecord.getName());

		return response;
	}

	// delete
	private async deleteFilesInFilesStorageClient(fileRecords: FileRecord[]) {
		const paths = getPaths(fileRecords);

		await this.storageClient.moveToTrash(paths);
	}

	private async deleteWithRollbackByError(fileRecords: FileRecord[]): Promise<void> {
		try {
			await this.deleteFilesInFilesStorageClient(fileRecords);
		} catch (error) {
			await this.fileRecordRepo.save(fileRecords);
			throw error;
		}
	}

	public async delete(fileRecords: FileRecord[]) {
		this.logger.debug({ action: 'delete', fileRecords });

		const markedFileRecords = markForDelete(fileRecords);
		await this.fileRecordRepo.save(markedFileRecords);

		await this.deleteWithRollbackByError(fileRecords);
	}

	public async deleteFilesOfParent(parentId: EntityId): Promise<Counted<FileRecord[]>> {
		const [fileRecords, count] = await this.getFileRecordsOfParent(parentId);

		if (count > 0) {
			await this.delete(fileRecords);
		}

		return [fileRecords, count];
	}

	// restore
	private async restoreFilesInFileStorageClient(fileRecords: FileRecord[]) {
		const paths = getPaths(fileRecords);

		await this.storageClient.restore(paths);
	}

	private async restoreWithRollbackByError(fileRecords: FileRecord[]): Promise<void> {
		try {
			await this.restoreFilesInFileStorageClient(fileRecords);
		} catch (err) {
			markForDelete(fileRecords);
			await this.fileRecordRepo.save(fileRecords);
			throw err;
		}
	}

	public async restoreFilesOfParent(params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		const [fileRecords, count] = await this.fileRecordRepo.findBySchoolIdAndParentIdAndMarkedForDelete(
			params.schoolId,
			params.parentId
		);

		if (count > 0) {
			await this.restore(fileRecords);
		}
		return [fileRecords, count];
	}

	public async restore(fileRecords: FileRecord[]) {
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
		const [fileRecords, count] = await this.fileRecordRepo.findBySchoolIdAndParentId(params.schoolId, params.parentId);

		if (count === 0) {
			return [[], 0];
		}

		const response = await this.copy(userId, fileRecords, copyFilesParams.target);

		return [response, count];
	}

	private async copyFileRecord(
		sourceFile: FileRecord,
		targetParams: FileRecordParams,
		userId: EntityId
	): Promise<FileRecord> {
		const fileRecord = sourceFile.copy(userId, targetParams);
		await this.fileRecordRepo.save(fileRecord);

		return fileRecord;
	}

	private sendToAntiVirusService(fileRecord: FileRecord) {
		if (fileRecord.isPending()) {
			this.antivirusService.send(fileRecord.getSecurityToken());
		}
	}

	private async copyFilesWithRollbackOnError(
		sourceFile: FileRecord,
		targetFile: FileRecord
	): Promise<CopyFileResponse> {
		try {
			const paths = createICopyFiles(sourceFile, targetFile);

			await this.storageClient.copy([paths]);
			this.sendToAntiVirusService(targetFile);
			const copyFileResponse = CopyFileResponseBuilder.build(targetFile.id, sourceFile.id, targetFile.getName());

			return copyFileResponse;
		} catch (error) {
			await this.fileRecordRepo.delete([targetFile]);
			throw error;
		}
	}

	public async copy(
		userId: EntityId,
		sourceFileRecords: FileRecord[],
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
