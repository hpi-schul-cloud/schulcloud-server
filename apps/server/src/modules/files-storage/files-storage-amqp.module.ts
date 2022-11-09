import { Module } from '@nestjs/common';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { FilesStorageConsumer } from './controller';
import { FilesStorageModule } from './files-storage.module';

@Module({
	imports: [FilesStorageModule, CoreModule, LoggerModule],
	providers: [FilesStorageConsumer],
})
export class FilesStorageAMQPModule {}
