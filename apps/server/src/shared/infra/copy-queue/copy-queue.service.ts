import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { Course } from '@shared/domain/entity/course.entity';
import { CopyQueueRoutingKeys, CopyQueueServiceOptions } from './copy-queue.interface';

@Injectable()
export class CopyQueueService {
	constructor(
		private readonly amqpConnection: AmqpConnection,
		@Inject('COPY_QUEUE_OPTIONS') private readonly options: CopyQueueServiceOptions
	) {}

	public async copyCourse(course: Course): Promise<void> {
		await this.amqpConnection.publish(this.options.exchange, CopyQueueRoutingKeys.COURSE, course, { persistent: true });
	}
}
