import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { CopyQueueRoutingKeys } from './copy-queue.interface';

@Injectable()
export class CopyQueueConsumer {
	@RabbitSubscribe({
		exchange: 'copy-queue',
		routingKey: CopyQueueRoutingKeys.COURSE,
		queue: 'server-built-in-copy-queue',
	})
	// eslint-disable-next-line @typescript-eslint/ban-types
	public handleCourseCopy(msg: {}) {
		// TODO: call domain service for course copy.
		console.log(`Received message: ${JSON.stringify(msg)}`);
	}
}
