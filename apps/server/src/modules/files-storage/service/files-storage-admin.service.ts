import { Logger } from '@core/logger';
import { S3ClientAdapter } from '@infra/s3-client';
import { Inject, Injectable } from '@nestjs/common';
import { FILES_STORAGE_S3_CONNECTION } from '../files-storage.config';
import { StorageLocationParams } from '../interface';
import { FileRecordRepo } from '../repo';

@Injectable()
export class FilesStorageAdminService {
	constructor(
		private readonly fileRecordRepo: FileRecordRepo,
		@Inject(FILES_STORAGE_S3_CONNECTION) private readonly storageClient: S3ClientAdapter,
		private logger: Logger
	) {
		this.logger.setContext(FilesStorageAdminService.name);
	}

	public async deleteByStorageLocation(params: StorageLocationParams): Promise<number> {
		const { storageLocation, storageLocationId } = params;

		const result = await this.fileRecordRepo.markForDeleteByStorageLocation(storageLocation, storageLocationId);
		await this.storageClient.moveDirectoryToTrash(storageLocationId);

		return result;
	}
}
