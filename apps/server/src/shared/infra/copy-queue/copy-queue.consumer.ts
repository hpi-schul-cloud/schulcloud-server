import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { Course, Lesson } from '@shared/domain';
import { OperationStatus } from '@shared/domain/entity/operation-status.entity';
import { CopyService } from '@src/modules/learnroom/uc/course-copy.service';
import { CopyQueueRoutingKeys } from './copy-queue.interface';

@Injectable()
export class CopyQueueConsumer {
	constructor(private readonly copyService: CopyService) {}

	@RabbitSubscribe({
		exchange: 'copy-queue',
		routingKey: CopyQueueRoutingKeys.COURSE,
		queue: 'server-built-in-copy-queue',
	})
	public async handleCourseCopy({ course, operation }: { course: Course; operation: OperationStatus }) {
		// TODO: call domain service for course copy.
		await this.copyService.copyCourse(course, operation);
	}

	@RabbitSubscribe({
		exchange: 'copy-queue',
		routingKey: CopyQueueRoutingKeys.LESSON,
		queue: 'server-built-in-copy-queue',
	})
	public async handleLessonCopy(msg: { lesson: Lesson; operation: OperationStatus }) {
		await this.copyService.copyLesson(msg.lesson, msg.operation);
	}
}
