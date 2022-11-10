import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Module } from '@nestjs/common';
import { FileStorageAdapter } from '@shared/infra/filestorage';
import { FilesRepo, StorageProviderRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { S3Config } from '@src/modules/files-storage/interface/config';
import { FileRecordRepo } from '@src/modules/files-storage/repo/filerecord.repo';
import { DeleteFilesConsole } from './job/delete-files.console';
import { DeleteOrphanedFilesConsole } from './job/delete-orphaned-files.console';
import { SyncFilesConsole } from './job/sync-files.console';
import { EmbeddedFilesRepo } from './repo/embedded-files.repo';
import { OrphanedFilesRepo } from './repo/orphaned-files.repo';
import { SyncFilesRepo } from './repo/sync-files.repo';
import { DeleteFilesUc, DeleteOrphanedFilesUc, SyncFilesUc } from './uc';
import { SyncEmbeddedFilesUc } from './uc/sync-embedded-files.uc';
import { SyncFilesMetadataService } from './uc/sync-files-metadata.service';
import { SyncFilesStorageService } from './uc/sync-files-storage.service';

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
		DeleteFilesUc,
		FilesRepo,
		FileStorageAdapter,
		// Temporary functionality for migration to new fileservice
		// TODO: Remove when BC-1496 is done!
		DeleteOrphanedFilesConsole,
		DeleteOrphanedFilesUc,
		OrphanedFilesRepo,
		SyncFilesConsole,
		SyncFilesUc,
		SyncFilesRepo,
		SyncFilesMetadataService,
		SyncFilesStorageService,
		FileRecordRepo,
		StorageProviderRepo,
		SyncEmbeddedFilesUc,
		EmbeddedFilesRepo,
		{
			provide: 'DESTINATION_S3_CONFIG',
			useValue: config,
		},
	],
})
export class FilesModule {}
