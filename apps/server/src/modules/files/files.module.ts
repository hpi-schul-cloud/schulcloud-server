import { LoggerModule } from '@core/logger';
import { StorageProviderRepo } from '@modules/school/repo';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DeleteFilesConsole } from './job';
import { FilesRepo } from './repo';
import { FilesService } from './service';
import { DeleteFilesUc } from './uc';

@Module({
	imports: [CqrsModule, LoggerModule],
	providers: [DeleteFilesConsole, DeleteFilesUc, FilesRepo, StorageProviderRepo, FilesService],
	exports: [FilesService],
})
export class FilesModule {}
