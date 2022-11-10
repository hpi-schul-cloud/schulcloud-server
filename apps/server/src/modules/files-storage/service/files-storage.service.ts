import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotAcceptableException,
	NotFoundException,
} from '@nestjs/common';
import { Counted, EntityId } from '@shared/domain';
import { AntivirusService } from '@shared/infra/antivirus/antivirus.service';
import { Logger } from '@src/core/logger';
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
import {
	createFileRecord,
	createICopyFiles,
	createPath,
	deriveStatusFromSource,
	getPaths,
	getResolvedValues,
	getStatusFromScanResult,
	isStatusBlocked,
	markForDelete,
	resolveFileNameDuplicates,
	unmarkForDelete,
} from '../helper';
import { IGetFileResponse } from '../interface';
import { FilesStorageMapper, CopyFileResponseBuilder } from '../mapper';
import { FileRecordRepo } from '../repo';

@Injectable()
export class FilesStorageService {
	constructor(
		private readonly fileRecordRepo: FileRecordRepo,
		private readonly storageClient: S3ClientAdapter,
		private readonly antivirusService: AntivirusService,
		private logger: Logger
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

	public async getFileRecordsOfParent(params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		const countedFileRecords = await this.fileRecordRepo.findBySchoolIdAndParentId(params.schoolId, params.parentId);

		return countedFileRecords;
	}

	// upload
	public async createFileInStorageAndRollbackOnError(
		fileRecord: FileRecord,
		params: FileRecordParams,
		fileDescription: FileDto
	): Promise<FileRecord> {
		try {
			const filePath = createPath(params.schoolId, fileRecord.id);
			await this.storageClient.create(filePath, fileDescription);
			this.antivirusService.send(fileRecord);

			return fileRecord;
		} catch (error) {
			await this.fileRecordRepo.delete(fileRecord);
			throw error;
		}
	}

	public async uploadFile(userId: EntityId, params: FileRecordParams, fileDescription: FileDto): Promise<FileRecord> {
		const [fileRecords] = await this.getFileRecordsOfParent(params);
		const fileName = resolveFileNameDuplicates(fileDescription.name, fileRecords);
		const fileRecord = createFileRecord(fileName, fileDescription.size, fileDescription.mimeType, params, userId);

		await this.fileRecordRepo.save(fileRecord);
		await this.createFileInStorageAndRollbackOnError(fileRecord, params, fileDescription);

		return fileRecord;
	}

	// update
	private checkDuplicatedNames(fileRecords: FileRecord[], newFileName: string): void {
		if (fileRecords.find((item) => item.name === newFileName)) {
			throw new ConflictException(ErrorType.FILE_NAME_EXISTS);
		}
	}

	public async patchFilename(fileRecord: FileRecord, data: RenameFileParams) {
		const fileRecordParams = FilesStorageMapper.mapFileRecordToFileRecordParams(fileRecord);
		const [fileRecords] = await this.getFileRecordsOfParent(fileRecordParams);

		this.checkDuplicatedNames(fileRecords, data.fileName);
		fileRecord.setName(data.fileName);
		await this.fileRecordRepo.save(fileRecord);

		return fileRecord;
	}

	public async updateSecurityStatus(token: string, scanResultDto: ScanResultParams) {
		const fileRecord = await this.fileRecordRepo.findBySecurityCheckRequestToken(token);

		const status = getStatusFromScanResult(scanResultDto);
		fileRecord.updateSecurityCheckStatus(status, scanResultDto.virus_signature);

		await this.fileRecordRepo.save(fileRecord);
	}

	// download
	private checkFileName(entity: FileRecord, params: DownloadFileParams): void | NotFoundException {
		if (entity.name !== params.fileName) {
			this.logger.debug(`could not find file with id: ${entity.id} by filename`);
			throw new NotFoundException(ErrorType.FILE_NOT_FOUND);
		}
	}

	private checkScanStatus(entity: FileRecord): void | NotAcceptableException {
		if (isStatusBlocked(entity)) {
			this.logger.warn(`file is blocked with id: ${entity.id}`);
			throw new NotAcceptableException(ErrorType.FILE_IS_BLOCKED);
		}
	}

	public async downloadFile(schoolId: EntityId, fileRecordId: EntityId): Promise<IGetFileResponse> {
		const pathToFile = createPath(schoolId, fileRecordId);
		const res = await this.storageClient.get(pathToFile);

		return res;
	}

	public async download(fileRecord: FileRecord, params: DownloadFileParams): Promise<IGetFileResponse> {
		this.checkFileName(fileRecord, params);
		this.checkScanStatus(fileRecord);

		const response = await this.downloadFile(fileRecord.schoolId, fileRecord.id);

		return response;
	}

	// delete
	private async deleteFilesInFilesStorageClient(fileRecords: FileRecord[]) {
		const paths = getPaths(fileRecords);

		await this.storageClient.delete(paths);
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

	public async deleteFilesOfParent(params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		const [fileRecords, count] = await this.getFileRecordsOfParent(params);

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

	public async copyFileRecord(
		sourceFile: FileRecord,
		targetParams: FileRecordParams,
		userId: EntityId
	): Promise<FileRecord> {
		const entity = createFileRecord(sourceFile.name, sourceFile.size, sourceFile.mimeType, targetParams, userId);

		entity.securityCheck = deriveStatusFromSource(sourceFile, entity);

		await this.fileRecordRepo.save(entity);

		return entity;
	}

	private sendToAntiVirusService(sourceFile: FileRecord) {
		if (sourceFile.securityCheck.status === ScanStatus.PENDING) {
			this.antivirusService.send(sourceFile);
		}
	}

	public async copyFilesWithRollbackOnError(sourceFile: FileRecord, targetFile: FileRecord): Promise<CopyFileResponse> {
		try {
			const paths = createICopyFiles(sourceFile, targetFile);

			await this.storageClient.copy([paths]);
			this.sendToAntiVirusService(sourceFile);
			const copyFileResponse = CopyFileResponseBuilder.build(targetFile.id, sourceFile.id, targetFile.name);

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

		const promises = sourceFileRecords.map(async (sourceFile) => {
			this.checkScanStatus(sourceFile);

			const targetFile = await this.copyFileRecord(sourceFile, targetParams, userId);
			const fileResponse = await this.copyFilesWithRollbackOnError(sourceFile, targetFile);

			return fileResponse;
		});

		const settledPromises = await Promise.allSettled(promises);
		const resolvedResponses = getResolvedValues(settledPromises);

		return resolvedResponses;
	}
}
