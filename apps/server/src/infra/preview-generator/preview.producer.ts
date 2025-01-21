import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { FilesPreviewEvents, FilesPreviewExchange, RpcMessageProducer } from '@infra/rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@core/logger';
import { PreviewFileOptions, PreviewResponseMessage } from './interface';
import { PreviewModuleConfig } from './interface/preview-consumer-config';
import { PreviewActionsLoggable } from './loggable/preview-actions.loggable';

@Injectable()
export class PreviewProducer extends RpcMessageProducer {
	constructor(
		protected readonly amqpConnection: AmqpConnection,
		private readonly logger: Logger,
		protected readonly configService: ConfigService<PreviewModuleConfig, true>
	) {
		const timeout = configService.get<number>('INCOMING_REQUEST_TIMEOUT');

		super(amqpConnection, FilesPreviewExchange, timeout);
		this.logger.setContext(PreviewProducer.name);
	}

	async generate(payload: PreviewFileOptions): Promise<PreviewResponseMessage> {
		this.logger.info(new PreviewActionsLoggable('PreviewProducer.generate:started', payload));

		const response = await this.request<PreviewResponseMessage>(FilesPreviewEvents.GENERATE_PREVIEW, payload);

		this.logger.info(new PreviewActionsLoggable('PreviewProducer.generate:finished', payload));

		return response;
	}
}
