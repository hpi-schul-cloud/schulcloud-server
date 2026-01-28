import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { CopyContentParams, DeleteContentParams, H5pEditorEvents } from '../h5p-editor.interface';
import type { H5pExchangeConfig } from '../h5p-exchange.config';

@Injectable()
export class H5pEditorProducer {
	constructor(private readonly amqpConnection: AmqpConnection, private readonly h5pExchangeConfig: H5pExchangeConfig) {}

	public async deleteContent(message: DeleteContentParams): Promise<void> {
		await this.amqpConnection.publish(this.h5pExchangeConfig.exchangeName, H5pEditorEvents.DELETE_CONTENT, message);
	}

	public async copyContent(message: CopyContentParams): Promise<void> {
		await this.amqpConnection.publish(this.h5pExchangeConfig.exchangeName, H5pEditorEvents.COPY_CONTENT, message);
	}
}
