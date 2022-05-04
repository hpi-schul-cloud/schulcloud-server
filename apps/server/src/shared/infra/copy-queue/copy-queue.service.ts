import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { Course, Lesson } from '@shared/domain';
import { OperationStatus } from '@shared/domain/entity/operation-status.entity';
import { CopyQueueRoutingKeys, CopyQueueServiceOptions } from './copy-queue.interface';

@Injectable()
export class CopyQueueService {
	constructor(
		private readonly amqpConnection: AmqpConnection,
		@Inject('COPY_QUEUE_OPTIONS') private readonly options: CopyQueueServiceOptions
	) {}

	public async copyCourse(course: Course, operation: OperationStatus): Promise<void> {
		await this.amqpConnection.publish(
			this.options.exchange,
			CopyQueueRoutingKeys.COURSE,
			{ course, operation },
			{ persistent: true }
		);
	}

	public async copyLesson(lesson: Lesson, operation: OperationStatus): Promise<void> {
		await this.amqpConnection.publish(
			this.options.exchange,
			CopyQueueRoutingKeys.LESSON,
			{ lesson, operation },
			{ persistent: true }
		);
	}
}
