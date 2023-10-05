import { Module } from '@nestjs/common';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { PreviewGeneratorConsumer } from './controller/preview-generator.consumer';
import { FilesStorageModule } from './files-storage.module';

@Module({
	imports: [FilesStorageModule, CoreModule, LoggerModule],
	providers: [PreviewGeneratorConsumer],
})
export class PreviewGeneratorAMQPModule {}
