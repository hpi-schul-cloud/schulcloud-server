import { Module } from '@nestjs/common';
import { FileStorageAdapter } from '@shared/infra/filestorage';
import { FileRecordRepo, FilesRepo, StorageProviderRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { DeleteFilesConsole } from './job/delete-files.console';
import { SyncTaskRepo } from './job/sync-filerecords-utils/sync-task.repo';
import { SyncFilerecordsConsole } from './job/sync-filerecords.console';
import { DeleteFilesUc } from './uc';

@Module({
	imports: [LoggerModule],
	providers: [
		DeleteFilesConsole,
		SyncFilerecordsConsole,
		DeleteFilesUc,
		FilesRepo,
		FileRecordRepo,
		SyncTaskRepo,
		StorageProviderRepo,
		FileStorageAdapter,
	],
})
export class FilesModule {}
