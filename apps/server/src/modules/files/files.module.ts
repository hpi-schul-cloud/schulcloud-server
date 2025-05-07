import { Module } from '@nestjs/common';
import { LoggerModule } from '@core/logger';
import { StorageProviderRepo } from '@modules/school/repo';
import { DeletionModule } from '@modules/deletion';
import { DeleteFilesConsole } from './job';
import { FilesRepo } from './repo';
import { FilesService } from './service';
import { DeleteFilesUc } from './uc';

@Module({
	imports: [LoggerModule, DeletionModule],
	providers: [DeleteFilesConsole, DeleteFilesUc, FilesRepo, StorageProviderRepo, FilesService],
	exports: [FilesService],
})
export class FilesModule {}
