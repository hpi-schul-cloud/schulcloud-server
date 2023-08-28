import { Module } from '@nestjs/common';
import { StorageProviderRepo } from '@shared/repo/storageprovider';
import { LoggerModule } from '@src/core/logger';
import { DeleteFilesConsole } from './job';
import { DeleteFilesUC } from './uc';
import { FilesRepo } from './repo';

@Module({
	imports: [LoggerModule],
	providers: [DeleteFilesConsole, DeleteFilesUC, FilesRepo, StorageProviderRepo],
})
export class FilesModule {}
