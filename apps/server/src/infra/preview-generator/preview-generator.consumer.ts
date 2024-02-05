import { AmqpConnection, RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { AmqpConsumerHealthIndicator } from '@infra/healthcheck/indicators/amqp-consumer.indictor';
import { FilesPreviewEvents, FilesPreviewExchange } from '@infra/rabbitmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { PreviewFileOptions } from './interface';
import { PreviewActionsLoggable } from './loggable/preview-actions.loggable';
import { PreviewGeneratorService } from './preview-generator.service';

@Injectable()
export class PreviewGeneratorConsumer implements OnModuleInit {
	onModuleInit() {
		console.log('onModuleInit', PreviewGeneratorConsumer.name);
	}

	constructor(
		private readonly previewGeneratorService: PreviewGeneratorService,
		private logger: Logger,
		private amqpConnection: AmqpConnection,
		private health: AmqpConsumerHealthIndicator
	) {
		this.logger.setContext(PreviewGeneratorConsumer.name);
		health.setAmqpConnection(amqpConnection);
	}

	healty() {}

	@RabbitRPC({
		exchange: FilesPreviewExchange,
		routingKey: FilesPreviewEvents.GENERATE_PREVIEW,
		queue: FilesPreviewEvents.GENERATE_PREVIEW,
	})
	public async generatePreview(@RabbitPayload() payload: PreviewFileOptions) {
		this.logger.info(new PreviewActionsLoggable('PreviewGeneratorConsumer.generatePreview:start', payload));

		console.log(this.health.isHealthy('preview-generator-consumer'));
		const response = await this.previewGeneratorService.generatePreview(payload);

		this.logger.info(new PreviewActionsLoggable('PreviewGeneratorConsumer.generatePreview:end', payload));

		return { message: response };
	}
}
