import { Module } from '@nestjs/common';
import { StorageProviderRepo } from '@shared/repo/storageprovider';
import { LoggerModule } from '@src/core/logger';
import { CqrsModule } from '@nestjs/cqrs';
import { DeleteFilesConsole } from './job';
import { DeleteFilesUc } from './uc';
import { FilesRepo } from './repo';
import { FilesService } from './service';

@Module({
	imports: [CqrsModule, LoggerModule],
	providers: [DeleteFilesConsole, DeleteFilesUc, FilesRepo, StorageProviderRepo, FilesService],
	exports: [FilesService],
})
export class FilesModule {}
