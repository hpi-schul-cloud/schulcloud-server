import { Module } from '@nestjs/common';
import { FilesRepo } from '@shared/repo';
import { StorageProviderRepo } from '@shared/repo/storageprovider/storageprovider.repo';
import { LoggerModule } from '@src/core/logger';
import { DeleteFilesConsole } from './job/delete-files.console';
import { DeleteFilesUc } from './uc';

@Module({
	imports: [LoggerModule],
	providers: [DeleteFilesConsole, DeleteFilesUc, FilesRepo, StorageProviderRepo],
})
export class FilesModule {}
