import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Module } from '@nestjs/common';
import { FileStorageAdapter } from '@shared/infra/filestorage';
import { FileRecordRepo, FilesRepo, StorageProviderRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { S3Config } from '../files-storage/interface';
import { DeleteFilesConsole } from './job/delete-files.console';
import { SyncFilesStorageService } from './uc/sync-files-storage.service';
import { SyncFilesRepo } from './repo/sync-files.repo';
import { SyncFilerecordsConsole } from './job/sync-filerecords.console';
import { DeleteFilesUc, SyncFilesUc } from './uc';
import { SyncFilesMetadataService } from './uc/sync-files-metadata.service';

export const config: S3Config = {
	endpoint: Configuration.get('FILES_STORAGE__S3_ENDPOINT') as string,
	region: Configuration.get('FILES_STORAGE__S3_REGION') as string,
	bucket: Configuration.get('FILES_STORAGE__S3_BUCKET') as string,
	accessKeyId: Configuration.get('FILES_STORAGE__S3_ACCESS_KEY_ID') as string,
	secretAccessKey: Configuration.get('FILES_STORAGE__S3_SECRET_ACCESS_KEY') as string,
};

@Module({
	imports: [LoggerModule],
	providers: [
		DeleteFilesConsole,
		SyncFilerecordsConsole,
		DeleteFilesUc,
		SyncFilesUc,
		FilesRepo,
		FileRecordRepo,
		SyncFilesRepo,
		StorageProviderRepo,
		FileStorageAdapter,
		SyncFilesMetadataService,
		SyncFilesStorageService,
		{
			provide: 'Destination_S3_Config',
			useValue: config,
		},
	],
})
export class FilesModule {}
