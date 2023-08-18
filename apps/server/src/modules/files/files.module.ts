import { Module } from '@nestjs/common';

import { StorageProviderRepo } from '@shared/repo/storageprovider/storageprovider.repo';
import { LoggerModule } from '@src/core/logger';

import { DeleteFilesConsole } from './job';
import { DeleteFilesUc } from './uc';
import { FilesRepo } from './repo';

@Module({
	imports: [LoggerModule],
	providers: [DeleteFilesConsole, DeleteFilesUc, FilesRepo, StorageProviderRepo],
})
export class FilesModule {}
