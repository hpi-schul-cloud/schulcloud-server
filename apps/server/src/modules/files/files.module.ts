import { LoggerModule } from '@core/logger';
import { SagaModule } from '@modules/saga';
import { StorageProviderRepo } from '@modules/school/repo';
import { Module } from '@nestjs/common';
import { FilesRepo } from './repo';
import { DeleteUserFilesDataStep } from './saga';

@Module({
	imports: [LoggerModule, SagaModule],
	providers: [FilesRepo, StorageProviderRepo, DeleteUserFilesDataStep],
	exports: [],
})
export class FilesModule {}
