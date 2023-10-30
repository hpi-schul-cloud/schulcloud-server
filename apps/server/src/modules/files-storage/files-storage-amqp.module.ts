import { Module } from '@nestjs/common';
import { CoreModule } from '@src/core/core.module';
import { LoggerModule } from '@src/core/logger/logger.module';
import { FilesStorageConsumer } from './controller/files-storage.consumer';
import { FilesStorageModule } from './files-storage.module';

@Module({
	imports: [FilesStorageModule, CoreModule, LoggerModule],
	providers: [FilesStorageConsumer],
})
export class FilesStorageAMQPModule {}
