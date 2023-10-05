import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { RabbitMQWrapperModule } from '../rabbitmq';
import { PreviewProducer } from './preview.producer';

const providers = [PreviewProducer];
@Module({
	imports: [LoggerModule, RabbitMQWrapperModule],
	providers,
	exports: providers,
})
export class PreviewGeneratorProducerModule {}
