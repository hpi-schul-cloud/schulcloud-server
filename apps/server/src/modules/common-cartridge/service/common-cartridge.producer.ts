import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ImportCourseParams, CommonCartridgeEvents, CommonCartridgeExchange } from '@infra/rabbitmq';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CommonCartridgeProducer {
	constructor(private readonly amqpConnection: AmqpConnection) {}

	public async importCourse(message: ImportCourseParams): Promise<void> {
		await this.amqpConnection.publish(CommonCartridgeExchange, CommonCartridgeEvents.IMPORT_COURSE, message);
	}
}
