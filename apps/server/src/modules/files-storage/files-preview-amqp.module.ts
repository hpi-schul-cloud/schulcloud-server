import { Module } from '@nestjs/common';
import { PreviewGeneratorConsumerModule } from '@shared/infra/preview-generator';
import { s3Config } from './files-storage.config';

@Module({
	imports: [PreviewGeneratorConsumerModule.register(s3Config)],
})
export class PreviewGeneratorAMQPModule {}
