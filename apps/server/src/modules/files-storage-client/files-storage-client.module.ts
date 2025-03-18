import { LoggerModule } from '@core/logger';
import { forwardRef, Module } from '@nestjs/common';
// The files-storage-client should not know the copy-helper
import { CopyHelperModule } from '@modules/copy-helper/copy-helper.module';
import { CopyFilesService, FilesStorageClientAdapterService, FilesStorageProducer } from './service';
import { DeletionModule } from '@modules/deletion';

@Module({
	imports: [LoggerModule, CopyHelperModule, forwardRef(() => DeletionModule)],
	providers: [FilesStorageClientAdapterService, CopyFilesService, FilesStorageProducer],
	exports: [FilesStorageClientAdapterService, CopyFilesService],
})
export class FilesStorageClientModule {}
