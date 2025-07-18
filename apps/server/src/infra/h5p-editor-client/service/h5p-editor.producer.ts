import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { CopyContentParams, DeleteContentParams, H5pEditorEvents, H5pEditorExchange } from '@infra/rabbitmq';
import { Injectable } from '@nestjs/common';

@Injectable()
export class H5pEditorProducer {
	constructor(private readonly amqpConnection: AmqpConnection) {}

	public async deleteContent(message: DeleteContentParams): Promise<void> {
		await this.amqpConnection.publish(H5pEditorExchange, H5pEditorEvents.DELETE_CONTENT, message);
	}

	public async copyContent(message: CopyContentParams): Promise<void> {
		await this.amqpConnection.publish(H5pEditorExchange, H5pEditorEvents.COPY_CONTENT, message);
	}
}
