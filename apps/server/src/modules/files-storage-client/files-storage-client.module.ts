import { LoggerModule } from '@core/logger';
import { Module } from '@nestjs/common';
// The files-storage-client should not know the copy-helper
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { CopyHelperModule } from '@modules/copy-helper/copy-helper.module';
import { CopyFilesService, FilesStorageClientAdapterService, FilesStorageProducer } from './service';

@Module({
	imports: [LoggerModule, CopyHelperModule, RabbitMQWrapperModule],
	providers: [FilesStorageClientAdapterService, CopyFilesService, FilesStorageProducer],
	exports: [FilesStorageClientAdapterService, CopyFilesService],
})
export class FilesStorageClientModule {}
