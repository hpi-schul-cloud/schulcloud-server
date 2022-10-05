import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Counted, FileRecord } from '@shared/domain';
import { FileRecordRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams, RenameFileParams, SingleFileParams } from '../controller/dto';
import { FilesStorageHelper } from '../helper';

@Injectable()
export class FilesStorageService {
	constructor(
		private readonly fileRecordRepo: FileRecordRepo,
		private readonly storageClient: S3ClientAdapter,
		private logger: Logger,
		private readonly filesStorageHelper: FilesStorageHelper
	) {
		this.logger.setContext(FilesStorageService.name);
	}

	// find
	public async getFile(params: SingleFileParams): Promise<FileRecord> {
		const fileRecord = await this.fileRecordRepo.findOneById(params.fileRecordId);

		return fileRecord;
	}

	public async getFilesOfParent(params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		const countedFileRecords = await this.fileRecordRepo.findBySchoolIdAndParentId(params.schoolId, params.parentId);

		return countedFileRecords;
	}

	// update
	public async patchFilename(fileRecord: FileRecord, data: RenameFileParams) {
		const fileRecordParams = this.filesStorageHelper.mapFileRecordToFileRecordParams(fileRecord);
		const [fileRecords] = await this.getFilesOfParent(fileRecordParams);

		const modifiedFileRecord = this.filesStorageHelper.modifiedFileNameInScope(fileRecord, fileRecords, data.fileName);
		await this.fileRecordRepo.save(modifiedFileRecord);

		return modifiedFileRecord;
	}

	// delete
	// TODO: name must be improved deleteFilesInFileStorage? nearly same name like the micro service
	// FilesStorageService as name is wrong FilesService as module and the storage is the storage it self
	private async deleteFilesInFileStorageClient(fileRecords: FileRecord[]) {
		const paths = this.filesStorageHelper.getPaths(fileRecords);

		await this.storageClient.delete(paths);
	}

	private async deleteWithRollbackByError(fileRecords: FileRecord[]): Promise<void> {
		try {
			await this.deleteFilesInFileStorageClient(fileRecords);
		} catch (error) {
			await this.fileRecordRepo.save(fileRecords);
			throw new InternalServerErrorException(error, `${FilesStorageService.name}:delete`);
		}
	}

	public async delete(fileRecords: FileRecord[]) {
		this.logger.debug({ action: 'delete', fileRecords });

		const markedFileRecords = this.filesStorageHelper.markForDelete(fileRecords);
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

	public async restoreOneFile(params: SingleFileParams): Promise<FileRecord> {
		const fileRecord = await this.fileRecordRepo.findOneByIdMarkedForDelete(params.fileRecordId);
		await this.restore([fileRecord]);

		return fileRecord;
	}

	public async restore(fileRecords: FileRecord[]) {
		this.logger.debug({ action: 'restore', fileRecords });

		const unmarkFileRecords = this.filesStorageHelper.unmarkForDelete(fileRecords);
		await this.fileRecordRepo.save(unmarkFileRecords);
		try {
			const paths = this.filesStorageHelper.getPaths(fileRecords);

			await this.storageClient.restore(paths);
		} catch (err) {
			await this.fileRecordRepo.save(fileRecords);
			this.filesStorageHelper.markForDelete(fileRecords);
			throw new InternalServerErrorException(err, `${FilesStorageService.name}:restore`);
		}
	}
}
