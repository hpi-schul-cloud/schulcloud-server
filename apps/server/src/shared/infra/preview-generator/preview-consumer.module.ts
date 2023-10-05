import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { PreviewGeneratorConsumer } from './preview-generator.consumer';
import { PreviewGeneratorService } from './preview-generator.service';

const providers = [PreviewGeneratorConsumer, PreviewGeneratorService];
@Module({
	imports: [LoggerModule],
	providers,
})
export class PreviewGeneratorConsumerModule {}
