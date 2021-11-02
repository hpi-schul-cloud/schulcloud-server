import { Module } from '@nestjs/common';
import { FileStorageAdapter } from '@shared/infra/filestorage';
import { FilesRepo, StorageProviderRepo } from '@shared/repo';
import { DeleteFilesConsole } from './job/delete-files.console';
import { LoggerModule } from '../../core/logger/logger.module';
import { DeleteFilesUc } from './uc';

@Module({
	imports: [LoggerModule],
	providers: [DeleteFilesConsole, DeleteFilesUc, FilesRepo, StorageProviderRepo, FileStorageAdapter],
})
export class FilesModule {}
