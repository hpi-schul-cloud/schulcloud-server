import { Module } from '@nestjs/common';
import { CopyHelperService } from '@shared/domain';
import { LoggerModule } from '@src/core/logger';
import { CopyFilesService } from './service/copy-files.service';
import { FilesStorageClientAdapterService } from './service/files-storage-client.service';
import { FilesStorageProducer } from './service/files-storage.producer';

@Module({
	imports: [LoggerModule],
	controllers: [],
	providers: [FilesStorageClientAdapterService, CopyFilesService, FilesStorageProducer, CopyHelperService],
	exports: [FilesStorageClientAdapterService, CopyFilesService],
})
export class FilesStorageClientModule {}
