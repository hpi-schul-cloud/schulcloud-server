import { Module } from '@nestjs/common';
import { LoggerModule } from '@core/logger';
// The files-storage-client should not know the copy-helper
import { CopyHelperModule } from '@modules/copy-helper/copy-helper.module';
import { CqrsModule } from '@nestjs/cqrs';
import { CopyFilesService, FilesStorageClientAdapterService, FilesStorageProducer } from './service';

@Module({
	imports: [LoggerModule, CopyHelperModule, CqrsModule],
	providers: [FilesStorageClientAdapterService, CopyFilesService, FilesStorageProducer],
	exports: [FilesStorageClientAdapterService, CopyFilesService],
})
export class FilesStorageClientModule {}
