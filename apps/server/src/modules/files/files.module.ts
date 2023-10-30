import { Module } from '@nestjs/common';
import { StorageProviderRepo } from '@shared/repo/storageprovider/storageprovider.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { DeleteFilesConsole } from './job/delete-files.console';
import { FilesRepo } from './repo/files.repo';
import { DeleteFilesUc } from './uc/delete-files.uc';

@Module({
	imports: [LoggerModule],
	providers: [DeleteFilesConsole, DeleteFilesUc, FilesRepo, StorageProviderRepo],
})
export class FilesModule {}
