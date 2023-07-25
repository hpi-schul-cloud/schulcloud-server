import crypto from 'crypto';
import gm from 'gm';
import {
	BadRequestException,
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotAcceptableException,
	NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Counted, EntityId } from '@shared/domain';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { LegacyLogger } from '@src/core/logger';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import {
	CopyFileResponse,
	CopyFilesOfParentParams,
	DownloadFileParams,
	FileRecordParams,
	PreviewParams,
	RenameFileParams,
	ScanResultParams,
	SingleFileParams,
} from '../controller/dto';
import { FileDto } from '../dto';
import { FileRecord } from '../entity';
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
import { IGetFileResponse } from '../interface';
import { CopyFileResponseBuilder, FileRecordMapper, FilesStorageMapper } from '../mapper';
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

	public async getFileRecordByName(params: RenameFileParams): Promise<Counted<FileRecord[]>> {
		const countedFileRecords = await this.fileRecordRepo.findByName(params.fileName);

		return countedFileRecords;
	}

	// upload
	public async uploadFile(
		userId: EntityId,
		params: FileRecordParams,
		filePath: string,
		file: FileDto
	): Promise<FileRecord> {
		const fileRecord = await this.createFileRecord(file, params, userId);
		await this.fileRecordRepo.save(fileRecord);

		await this.createFileInStorageAndRollbackOnError(fileRecord, filePath, file);

		return fileRecord;
	}

	private async createFileRecord(file: FileDto, params: FileRecordParams, userId: EntityId): Promise<FileRecord> {
		const fileName = await this.resolveFileName(file, params);

		// Create fileRecord with 0 as initial file size, because it is overwritten later anyway.
		const fileRecord = createFileRecord(fileName, 0, file.mimeType, params, userId);

		return fileRecord;
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
		filePath: string,
		file: FileDto
	): Promise<void> {
		try {
			const fileSizePromise = this.countFileSize(file);

			await this.storageClient.create(filePath, file);

			// The actual file size is set here because it is known only after the whole file is streamed.
			fileRecord.size = await fileSizePromise;
			this.throwErrorIfFileIsTooBig(fileRecord.size);
			await this.fileRecordRepo.save(fileRecord);

			this.antivirusService.send(fileRecord.getSecurityToken());
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

	private checkIfPreviewPossible(fileRecord: FileRecord): void | NotAcceptableException {
		if (!fileRecord.isPreviewPossible()) {
			this.logger.warn(`could not generate preview for : ${fileRecord.id} ${fileRecord.mimeType}`);
			throw new NotAcceptableException(ErrorType.PREVIEW_NOT_POSSIBLE);
		}
	}

	public async downloadFile(
		schoolId: EntityId,
		fileRecordId: EntityId,
		bytesRange?: string
	): Promise<IGetFileResponse> {
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

		const response = await this.downloadFile(fileRecord.getSchoolId(), fileRecord.id, bytesRange);

		return response;
	}

	public async downloadPreview(
		fileRecord: FileRecord,
		params: DownloadFileParams,
		previewParams: PreviewParams,
		bytesRange?: string
	): Promise<IGetFileResponse> {
		this.checkIfPreviewPossible(fileRecord);

		const fileParamsString = `${params.fileRecordId}${params.fileName}${previewParams.width}${previewParams.height}${previewParams.ratio}`;
		const hash = crypto.createHash('md5').update(fileParamsString).digest('hex');
		let response: IGetFileResponse;

		const [fileRecords, count] = await this.fileRecordRepo.findByName(hash);

		if (count === 0) {
			response = await this.generatePreview(fileRecord, params, previewParams, hash, bytesRange);
		} else {
			response = await this.download(fileRecords[0], params, bytesRange);
		}

		return response;
	}

	private async generatePreview(
		fileRecord: FileRecord,
		params: DownloadFileParams,
		previewParams: PreviewParams,
		hash: string,
		bytesRange?: string
	) {
		const original = await this.download(fileRecord, params, bytesRange);

		const im = gm.subClass({ imageMagick: true });

		const preview = im(original.data, fileRecord.name).resize(previewParams.width, previewParams.height).stream();

		const fileRecordParams = {
			schoolId: fileRecord.getSchoolId(),
			parentId: fileRecord.parentId,
			parentType: fileRecord.parentType,
		};
		const filePath = [fileRecord.getSchoolId(), 'previews', fileRecord._id].join('/');
		const fileDto = { name: hash, data: preview, mimeType: fileRecord.mimeType };

		await this.uploadFile(fileRecord.creatorId, fileRecordParams, filePath, fileDto);

		return preview;
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
			throw new InternalServerErrorException(error, `${FilesStorageService.name}:delete`);
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
			throw new InternalServerErrorException(err, `${FilesStorageService.name}:restore`);
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
