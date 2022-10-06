import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { CopyFilesService } from './uc/copy-files.service';
import { FilesStorageClientAdapterService } from './uc/files-storage-client.service';
import { FilesStorageProducer } from './uc/files-storage.producer';

@Module({
	imports: [LoggerModule],
	controllers: [],
	providers: [FilesStorageClientAdapterService, CopyFilesService, FilesStorageProducer],
	exports: [FilesStorageClientAdapterService, CopyFilesService],
})
export class FilesStorageClientModule {}
