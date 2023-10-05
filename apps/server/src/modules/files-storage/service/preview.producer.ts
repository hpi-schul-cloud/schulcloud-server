import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesStorageEvents, FilesStorageExchange, RpcMessageProducer } from '@shared/infra/rabbitmq';
import { LegacyLogger } from '@src/core/logger';
import { IFileStorageConfig } from '../files-storage.config';
import { PreviewFileOptions, PreviewResponseMessage } from '../interface';

@Injectable()
export class PreviewProducer extends RpcMessageProducer {
	constructor(
		protected readonly amqpConnection: AmqpConnection,
		private readonly logger: LegacyLogger,
		protected readonly configService: ConfigService<IFileStorageConfig, true>
	) {
		super(amqpConnection, FilesStorageExchange, configService.get('INCOMING_REQUEST_TIMEOUT'));
		this.logger.setContext(PreviewProducer.name);
	}

	async generate(payload: PreviewFileOptions): Promise<PreviewResponseMessage[]> {
		this.logger.debug({ action: 'generate:started', payload });
		const response = await this.request<PreviewResponseMessage[]>(FilesStorageEvents.GENERATE_PREVIEW, payload);

		this.logger.debug({ action: 'generate:finished', payload });

		return response;
	}
}
