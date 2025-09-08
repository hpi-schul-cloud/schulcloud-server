import { LoggerModule } from '@core/logger';
import { Module } from '@nestjs/common';
// The files-storage-client should not know the copy-helper
import { CopyHelperModule } from '@modules/copy-helper/copy-helper.module';
import { SagaModule } from '@modules/saga';
import { DeleteUserFilesStorageDataStep } from './saga';
import { CopyFilesService, FilesStorageClientAdapterService, FilesStorageProducer } from './service';

@Module({
	imports: [LoggerModule, CopyHelperModule, SagaModule],
	providers: [FilesStorageClientAdapterService, CopyFilesService, FilesStorageProducer, DeleteUserFilesStorageDataStep],
	exports: [FilesStorageClientAdapterService, CopyFilesService],
})
export class FilesStorageClientModule {}
