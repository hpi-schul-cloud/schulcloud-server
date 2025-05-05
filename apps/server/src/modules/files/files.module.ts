import { LoggerModule } from '@core/logger';
import { StorageProviderRepo } from '@modules/school/repo';
import { Module } from '@nestjs/common';
import { DeleteFilesConsole } from './job';
import { FilesRepo } from './repo';
import { DeleteUserFilesDataStep } from './saga';
import { FilesService } from './service';
import { DeleteFilesUc } from './uc';

@Module({
	imports: [LoggerModule],
	providers: [DeleteFilesConsole, DeleteFilesUc, FilesRepo, StorageProviderRepo, FilesService, DeleteUserFilesDataStep],
	exports: [FilesService],
})
export class FilesModule {}
