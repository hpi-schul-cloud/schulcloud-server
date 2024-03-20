import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
// The files-storage-client should not know the copy-helper
import { CopyHelperModule } from '@modules/copy-helper';
import { CqrsModule } from '@nestjs/cqrs';
import { CopyFilesService, FilesStorageClientAdapterService, FilesStorageProducer } from './service';

@Module({
	imports: [LoggerModule, CopyHelperModule, CqrsModule],
	providers: [FilesStorageClientAdapterService, CopyFilesService, FilesStorageProducer],
	exports: [FilesStorageClientAdapterService, CopyFilesService],
})
export class FilesStorageClientModule {}
