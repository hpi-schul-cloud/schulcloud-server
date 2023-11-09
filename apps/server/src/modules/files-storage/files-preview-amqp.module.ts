import { Module } from '@nestjs/common';
import { PreviewGeneratorConsumerModule } from '@infra/preview-generator';
import { defaultConfig, s3Config } from './files-storage.config';

@Module({
	imports: [PreviewGeneratorConsumerModule.register({ storageConfig: s3Config, serverConfig: defaultConfig })],
})
export class PreviewGeneratorAMQPModule {}
