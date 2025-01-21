import { CoreModule } from '@core/core.module';
import { LoggerModule } from '@core/logger';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common';
import { FilesStorageConsumer } from './controller';
import { config } from './files-storage.config';
import { FilesStorageModule } from './files-storage.module';

@Module({
	imports: [FilesStorageModule, CoreModule, LoggerModule, ConfigModule.forRoot(createConfigModuleOptions(config))],
	providers: [FilesStorageConsumer],
})
export class FilesStorageAMQPModule {}
