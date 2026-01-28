import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { InternalRabbitMQExchange } from '@infra/rabbitmq';
import { Injectable } from '@nestjs/common';
import { DeleteContentParams, H5pEditorEvents, CopyContentParams } from '../h5p-editor.interface';

@Injectable()
export class H5pEditorProducer {
	constructor(
		private readonly amqpConnection: AmqpConnection,
		private readonly h5pExchangeConfig: InternalRabbitMQExchange
	) {}

	public async deleteContent(message: DeleteContentParams): Promise<void> {
		await this.amqpConnection.publish(this.h5pExchangeConfig.exchangeName, H5pEditorEvents.DELETE_CONTENT, message);
	}

	public async copyContent(message: CopyContentParams): Promise<void> {
		await this.amqpConnection.publish(this.h5pExchangeConfig.exchangeName, H5pEditorEvents.COPY_CONTENT, message);
	}
}
