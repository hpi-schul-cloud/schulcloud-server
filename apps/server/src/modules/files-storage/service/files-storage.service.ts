import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Counted, FileRecord } from '@shared/domain';
import { FileRecordRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams, RenameFileParams, ScanResultParams, SingleFileParams } from '../controller/dto';
import {
	getPaths,
	getStatusFromScanResult,
	mapFileRecordToFileRecordParams,
	markForDelete,
	modifyFileNameInScope,
	unmarkForDelete,
} from '../helper';

@Injectable()
export class FilesStorageService {
	constructor(
		private readonly fileRecordRepo: FileRecordRepo,
		private readonly storageClient: S3ClientAdapter,
		private logger: Logger
	) {
		this.logger.setContext(FilesStorageService.name);
	}

	// find
	public async getFile(params: SingleFileParams): Promise<FileRecord> {
		const fileRecord = await this.fileRecordRepo.findOneById(params.fileRecordId);

		return fileRecord;
	}

	public async getFileMarkedForDelete(params: SingleFileParams) {
		const fileRecord = await this.fileRecordRepo.findOneByIdMarkedForDelete(params.fileRecordId);

		return fileRecord;
	}

	public async getFilesOfParent(params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		const countedFileRecords = await this.fileRecordRepo.findBySchoolIdAndParentId(params.schoolId, params.parentId);

		return countedFileRecords;
	}

	// update
	public async patchFilename(fileRecord: FileRecord, data: RenameFileParams) {
		const fileRecordParams = mapFileRecordToFileRecordParams(fileRecord);
		const [fileRecords] = await this.getFilesOfParent(fileRecordParams);

		const modifiedFileRecord = modifyFileNameInScope(fileRecord, fileRecords, data.fileName);
		await this.fileRecordRepo.save(modifiedFileRecord);

		return modifiedFileRecord;
	}

	public async updateSecurityStatus(token: string, scanResultDto: ScanResultParams) {
		const fileRecord = await this.fileRecordRepo.findBySecurityCheckRequestToken(token);

		const status = getStatusFromScanResult(scanResultDto);
		fileRecord.updateSecurityCheckStatus(status, scanResultDto.virus_signature);

		await this.fileRecordRepo.save(fileRecord);
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
		const [fileRecords, count] = await this.getFilesOfParent(params);

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
}
