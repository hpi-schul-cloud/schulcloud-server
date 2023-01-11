import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { CopyHelperModule } from '@src/modules/copy-helper';
import { CopyFilesService } from './service/copy-files.service';
import { FilesStorageClientAdapterService } from './service/files-storage-client.service';
import { FilesStorageProducer } from './service/files-storage.producer';

@Module({
	imports: [LoggerModule, CopyHelperModule],
	controllers: [],
	providers: [FilesStorageClientAdapterService, CopyFilesService, FilesStorageProducer],
	exports: [FilesStorageClientAdapterService, CopyFilesService],
})
export class FilesStorageClientModule {}
