import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger/logger.module';
import { CopyHelperModule } from '../copy-helper/copy-helper.module';
import { CopyFilesService } from './service/copy-files.service';
import { FilesStorageClientAdapterService } from './service/files-storage-client.service';
import { FilesStorageProducer } from './service/files-storage.producer';

@Module({
	imports: [LoggerModule, CopyHelperModule],
	providers: [FilesStorageClientAdapterService, CopyFilesService, FilesStorageProducer],
	exports: [FilesStorageClientAdapterService, CopyFilesService],
})
export class FilesStorageClientModule {}
