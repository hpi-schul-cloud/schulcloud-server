import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { FilesStorageConsumer } from './controller';
import { config } from './files-storage.config';
import { FilesStorageModule } from './files-storage.module';

@Module({
	imports: [FilesStorageModule, CoreModule, LoggerModule, ConfigModule.forRoot(createConfigModuleOptions(config))],
	providers: [FilesStorageConsumer],
})
export class FilesStorageAMQPModule {}
