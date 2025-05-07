import { LoggerModule } from '@core/logger';
import { SagaModule } from '@modules/saga';
import { StorageProviderRepo } from '@modules/school/repo';
import { Module } from '@nestjs/common';
import { DeleteFilesConsole } from './job';
import { FilesRepo } from './repo';
import { DeleteUserFilesDataStep } from './saga';
import { DeleteFilesUc } from './uc';

@Module({
	imports: [LoggerModule, SagaModule],
	providers: [DeleteFilesConsole, DeleteFilesUc, FilesRepo, StorageProviderRepo, DeleteUserFilesDataStep],
	exports: [],
})
export class FilesModule {}
