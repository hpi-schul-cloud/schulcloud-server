import { ErrorUtils } from '@core/error/utils';
import { LegacyLogger } from '@core/logger';
import { AntivirusService, ScanResult } from '@infra/antivirus';
import { CopyFiles, S3ClientAdapter } from '@infra/s3-client';
import { ConflictException, Inject, Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Counted, EntityId } from '@shared/domain/types';
import FileType from 'file-type-cjs/file-type-cjs-index';
import { PassThrough, Readable } from 'stream';
import { ScanStatus } from '../../domain';
import { FILES_STORAGE_S3_CONNECTION, FileStorageConfig } from '../../files-storage.config';
import { FileDto } from '../dto';
import { ErrorType } from '../error';
import { FileRecord, ParentInfo } from '../file-record.do';
import { FileRecordFactory } from '../file-record.factory';
import { CopyFileResult, FILE_RECORD_REPO, FileRecordRepo, GetFileResponse, StorageLocationParams } from '../interface';
import { FileResponseBuilder, ScanResultDtoMapper } from '../mapper';

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
	public async getFileRecord(fileRecordId: EntityId): Promise<FileRecord> {
		const fileRecord = await this.fileRecordRepo.findOneById(fileRecordId);

		return fileRecord;
	}

	public getFileRecords(fileRecordIds: EntityId[]): Promise<Counted<FileRecord[]>> {
		const fileRecords = this.fileRecordRepo.findMultipleById(fileRecordIds);

		return fileRecords;
	}

	public async getFileRecordBySecurityCheckRequestToken(token: string): Promise<FileRecord> {
		const fileRecord = await this.fileRecordRepo.findBySecurityCheckRequestToken(token);

		return fileRecord;
	}

	public async getFileRecordMarkedForDelete(fileRecordId: EntityId): Promise<FileRecord> {
		const fileRecord = await this.fileRecordRepo.findOneByIdMarkedForDelete(fileRecordId);

		return fileRecord;
	}

	public async getFileRecordsOfParent(parentId: EntityId): Promise<Counted<FileRecord[]>> {
		const countedFileRecords = await this.fileRecordRepo.findByParentId(parentId);

		return countedFileRecords;
	}

	public async getFileRecordsByCreatorId(creatorId: EntityId): Promise<Counted<FileRecord[]>> {
		const countedFileRecords = await this.fileRecordRepo.findByCreatorId(creatorId);

		return countedFileRecords;
	}

	// upload
	public async uploadFile(userId: EntityId, parentInfo: ParentInfo, file: FileDto): Promise<FileRecord> {
		const { fileRecord, stream } = await this.createFileRecord(file, parentInfo, userId);
		// MimeType Detection consumes part of the stream, so the restored stream is passed on
		file.data = stream;
		file.mimeType = fileRecord.mimeType;
		await this.fileRecordRepo.save(fileRecord);

		await this.createFileInStorageAndRollbackOnError(fileRecord, file);

		return fileRecord;
	}

	private async createFileRecord(
		file: FileDto,
		parentInfo: ParentInfo,
		userId: EntityId
	): Promise<{ fileRecord: FileRecord; stream: Readable }> {
		const fileName = await this.resolveFileName(file, parentInfo);
		const { mimeType, stream } = await this.detectMimeType(file);

		// Create fileRecord with 0 as initial file size, because it is overwritten later anyway.
		const fileRecord = FileRecordFactory.buildFromExternalInput(fileName, 0, mimeType, parentInfo, userId);

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

	private async resolveFileName(file: FileDto, parentInfo: ParentInfo): Promise<string> {
		let fileName = file.name;

		const [fileRecordsOfParent, count] = await this.getFileRecordsOfParent(parentInfo.parentId);
		if (count > 0) {
			fileName = FileRecord.resolveFileNameDuplicates(fileRecordsOfParent, file.name);
		}

		return fileName;
	}

	private async createFileInStorageAndRollbackOnError(fileRecord: FileRecord, file: FileDto): Promise<void> {
		const filePath = fileRecord.createPath();
		const useStreamToAntivirus = this.configService.get<boolean>('USE_STREAM_TO_ANTIVIRUS');

		try {
			const fileSizePromise = this.countFileSize(file);

			if (useStreamToAntivirus && fileRecord.isPreviewPossible()) {
				const streamToAntivirus = file.data.pipe(new PassThrough());

				const [, antivirusClientResponse] = await Promise.all([
					this.storageClient.create(filePath, file),
					this.antivirusService.checkStream(streamToAntivirus),
				]);
				const { status, reason } = ScanResultDtoMapper.fromScanResult(antivirusClientResponse);
				fileRecord.updateSecurityCheckStatus(status, reason);
			} else {
				await this.storageClient.create(filePath, file);
			}

			// The actual file size is set here because it is known only after the whole file is streamed.
			const fileRecordSize = await fileSizePromise;

			fileRecord.markAsUploaded(fileRecordSize, this.getMaxFileSize());

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

	private async sendToAntivirus(fileRecord: FileRecord): Promise<void> {
		const maxSecurityCheckFileSize = this.configService.get('MAX_SECURITY_CHECK_FILE_SIZE', { infer: true });

		if (fileRecord.sizeInByte > maxSecurityCheckFileSize) {
			fileRecord.updateSecurityCheckStatus(ScanStatus.WONT_CHECK, 'File is too big');
			await this.fileRecordRepo.save(fileRecord);
		} else {
			await this.antivirusService.send(fileRecord.getSecurityToken());
		}
	}

	public getMaxFileSize(): number {
		const maxFileSize = this.configService.get('MAX_FILE_SIZE', { infer: true });

		return maxFileSize;
	}

	// update
	private checkDuplicatedNames(fileRecords: FileRecord[], newFileName: string): void {
		if (fileRecords.find((item) => item.hasName(newFileName))) {
			throw new ConflictException(ErrorType.FILE_NAME_EXISTS);
		}
	}

	public async patchFilename(fileRecord: FileRecord, fileName: string): Promise<FileRecord> {
		const parentInfo = fileRecord.getParentInfo();
		const [fileRecords] = await this.getFileRecordsOfParent(parentInfo.parentId);

		this.checkDuplicatedNames(fileRecords, fileName);
		fileRecord.setName(fileName);
		await this.fileRecordRepo.save(fileRecord);

		return fileRecord;
	}

	public async updateSecurityStatus(token: string, scanResult: ScanResult): Promise<void> {
		const fileRecord = await this.fileRecordRepo.findBySecurityCheckRequestToken(token);

		const { status, reason } = ScanResultDtoMapper.fromScanResult(scanResult);
		fileRecord.updateSecurityCheckStatus(status, reason);

		await this.fileRecordRepo.save(fileRecord);
	}

	// download
	public checkFileName(fileRecord: FileRecord, fileName: string): void | NotFoundException {
		if (!fileRecord.hasName(fileName)) {
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

	public async downloadFile(fileRecord: FileRecord, bytesRange?: string): Promise<GetFileResponse> {
		const pathToFile = fileRecord.createPath();
		const file = await this.storageClient.get(pathToFile, bytesRange);
		const response = FileResponseBuilder.build(file, fileRecord.getName());

		return response;
	}

	public async download(fileRecord: FileRecord, fileName: string, bytesRange?: string): Promise<GetFileResponse> {
		this.checkFileName(fileRecord, fileName);
		this.checkScanStatus(fileRecord);

		const response = await this.downloadFile(fileRecord, bytesRange);

		return response;
	}

	// delete
	private async deleteFilesInFilesStorageClient(fileRecords: FileRecord[]): Promise<void> {
		const paths = FileRecord.getPaths(fileRecords);

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

	public async delete(fileRecords: FileRecord[]): Promise<void> {
		this.logger.debug({ action: 'delete', fileRecords });

		FileRecord.markForDelete(fileRecords);
		await this.fileRecordRepo.save(fileRecords);

		await this.deleteWithRollbackByError(fileRecords);
	}

	public async deleteFilesOfParent(fileRecords: FileRecord[]): Promise<void> {
		if (fileRecords.length > 0) {
			await this.delete(fileRecords);
		}
	}

	public async removeCreatorIdFromFileRecords(fileRecords: FileRecord[]): Promise<void> {
		FileRecord.removeCreatorId(fileRecords);
		await this.fileRecordRepo.save(fileRecords);
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
	private async restoreFilesInFileStorageClient(fileRecords: FileRecord[]): Promise<void> {
		const paths = FileRecord.getPaths(fileRecords);

		await this.storageClient.restore(paths);
	}

	private async restoreWithRollbackByError(fileRecords: FileRecord[]): Promise<void> {
		try {
			await this.restoreFilesInFileStorageClient(fileRecords);
		} catch (err) {
			FileRecord.markForDelete(fileRecords);
			await this.fileRecordRepo.save(fileRecords);
			throw err;
		}
	}

	public async restoreFilesOfParent(parentInfo: ParentInfo): Promise<Counted<FileRecord[]>> {
		const [fileRecords, count] = await this.fileRecordRepo.findByStorageLocationIdAndParentIdAndMarkedForDelete(
			parentInfo.storageLocation,
			parentInfo.storageLocationId,
			parentInfo.parentId
		);

		if (count > 0) {
			await this.restore(fileRecords);
		}
		return [fileRecords, count];
	}

	public async restore(fileRecords: FileRecord[]): Promise<void> {
		this.logger.debug({ action: 'restore', fileRecords });

		FileRecord.unmarkForDelete(fileRecords);
		await this.fileRecordRepo.save(fileRecords);

		await this.restoreWithRollbackByError(fileRecords);
	}

	// copy
	public async copyFilesOfParent(
		userId: string,
		sourceParentInfo: ParentInfo,
		targetParentInfo: ParentInfo
	): Promise<Counted<CopyFileResult[]>> {
		const [fileRecords, count] = await this.fileRecordRepo.findByStorageLocationIdAndParentId(
			sourceParentInfo.storageLocation,
			sourceParentInfo.storageLocationId,
			sourceParentInfo.parentId
		);

		if (count === 0) {
			return [[], 0];
		}

		const response = await this.copy(userId, fileRecords, targetParentInfo);

		return [response, count];
	}

	private async copyFileRecord(
		sourceFile: FileRecord,
		targetParentInfo: ParentInfo,
		userId: EntityId
	): Promise<FileRecord> {
		const fileRecord = FileRecordFactory.copy(sourceFile, userId, targetParentInfo);
		await this.fileRecordRepo.save(fileRecord);

		return fileRecord;
	}

	private async sendToAntiVirusService(fileRecord: FileRecord): Promise<void> {
		if (fileRecord.isPending()) {
			await this.antivirusService.send(fileRecord.getSecurityToken());
		}
	}

	private async copyFilesWithRollbackOnError(sourceFile: FileRecord, targetFile: FileRecord): Promise<CopyFileResult> {
		try {
			const copyFiles: CopyFiles = {
				sourcePath: sourceFile.createPath(),
				targetPath: targetFile.createPath(),
			};

			await this.storageClient.copy([copyFiles]);
			await this.sendToAntiVirusService(targetFile);

			const copyFileResult: CopyFileResult = { id: targetFile.id, sourceId: sourceFile.id, name: targetFile.getName() };

			return copyFileResult;
		} catch (error) {
			await this.fileRecordRepo.delete([targetFile]);
			throw error;
		}
	}

	public async copy(
		userId: EntityId,
		sourceFileRecords: FileRecord[],
		targetParentInfo: ParentInfo
	): Promise<CopyFileResult[]> {
		this.logger.debug({ action: 'copy', sourceFileRecords, targetParams: targetParentInfo });

		const promises: Promise<CopyFileResult>[] = sourceFileRecords.map(async (sourceFile) => {
			try {
				this.checkScanStatus(sourceFile);

				const targetFile = await this.copyFileRecord(sourceFile, targetParentInfo, userId);
				const copyFileResult = await this.copyFilesWithRollbackOnError(sourceFile, targetFile);

				return copyFileResult;
			} catch (error) {
				this.logger.error(`copy file failed for source fileRecordId ${sourceFile.id}`, error);

				const copyFileResult: CopyFileResult = { id: undefined, sourceId: sourceFile.id, name: sourceFile.getName() };

				return copyFileResult;
			}
		});

		const settledPromises = await Promise.all(promises);

		return settledPromises;
	}
}
