import { PreviewGeneratorConsumerModule } from '@infra/preview-generator';
import { Module } from '@nestjs/common';
import { CoreModule } from '@src/core';
import { defaultConfig, s3Config } from './files-storage.config';

@Module({
	imports: [
		PreviewGeneratorConsumerModule.register({ storageConfig: s3Config, serverConfig: defaultConfig }),
		CoreModule,
	],
})
export class PreviewGeneratorAMQPModule {}
