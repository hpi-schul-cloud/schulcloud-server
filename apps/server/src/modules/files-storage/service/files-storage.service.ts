import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Counted, FileRecord } from '@shared/domain';
import { FileRecordRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams } from '../controller/dto';
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

	public async delete(fileRecords: FileRecord[]) {
		this.logger.debug({ action: 'delete', fileRecords });

		this.filesStorageHelper.isArrayEmpty(fileRecords);

		const markedFileRecords = this.filesStorageHelper.markForDelete(fileRecords);
		await this.fileRecordRepo.save(markedFileRecords);

		try {
			const paths = this.filesStorageHelper.getPaths(fileRecords);

			await this.storageClient.delete(paths);
		} catch (err) {
			await this.fileRecordRepo.save(fileRecords);
			throw new InternalServerErrorException(err, `${FilesStorageService.name}:delete`);
		}
	}

	public async deleteFilesOfParent(params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		const [fileRecords, count] = await this.fileRecordRepo.findBySchoolIdAndParentId(params.schoolId, params.parentId);

		await this.delete(fileRecords);

		return [fileRecords, count];
	}
}
