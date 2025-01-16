import { Module } from '@nestjs/common';
import { LoggerModule } from '@core/logger';
import { RabbitMQWrapperModule } from '../rabbitmq';
import { PreviewProducer } from './preview.producer';

@Module({
	imports: [LoggerModule, RabbitMQWrapperModule],
	providers: [PreviewProducer],
	exports: [PreviewProducer],
})
export class PreviewGeneratorProducerModule {}
