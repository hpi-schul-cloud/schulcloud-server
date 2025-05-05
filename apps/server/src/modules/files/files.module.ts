import { LoggerModule } from '@core/logger';
import { SagaModule } from '@modules/saga';
import { StorageProviderRepo } from '@modules/school/repo';
import { Module } from '@nestjs/common';
import { DeleteFilesConsole } from './job';
import { FilesRepo } from './repo';
import { DeleteUserFilesDataStep } from './saga';
import { FilesService } from './service';
import { DeleteFilesUc } from './uc';

@Module({
	imports: [LoggerModule, SagaModule],
	providers: [DeleteFilesConsole, DeleteFilesUc, FilesRepo, StorageProviderRepo, FilesService, DeleteUserFilesDataStep],
	exports: [FilesService],
})
export class FilesModule {}
