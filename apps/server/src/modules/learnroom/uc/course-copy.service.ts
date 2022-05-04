import { Injectable } from '@nestjs/common';
import { Course, EntityId, Lesson } from '@shared/domain';
import { OperationStatus } from '@shared/domain/entity/operation-status.entity';
import { CopyQueueService } from '@shared/infra/copy-queue/copy-queue.service';
import { CourseRepo, LessonRepo } from '@shared/repo';
import { OperationStatusRepo } from '@shared/repo/OperationStatus/operation-status.repo';

@Injectable()
export class CopyService {
	constructor(
		private readonly courseRepo: CourseRepo,
		private readonly operationRepo: OperationStatusRepo,
		private readonly lessonRepo: LessonRepo,
		private readonly copyQueueService: CopyQueueService
	) {}

	async startCopyCourse(courseId: EntityId): Promise<OperationStatus> {
		const course = await this.courseRepo.findById(courseId);
		const operation = await this.operationRepo.LogOperationStart('copy course');
		await this.copyQueueService.copyCourse(course, operation);
		return operation;
	}

	async copyCourse(original: Course, operation: OperationStatus): Promise<void> {
		const copy = new Course({ name: original.name, school: original.school });
		await this.courseRepo.save(copy);
		const [lessons] = await this.lessonRepo.findAllByCourseIds([original.id]);
		await Promise.all(
			lessons.map(async (lesson) => {
				await this.operationRepo.LogOperationStart('copy lesson', operation.id);
				await this.copyQueueService.copyLesson(lesson, operation);
			})
		);
		await this.operationRepo.LogOperationSuccess('copy course', operation.id);
	}

	async copyLesson(lesson: Lesson, operation: OperationStatus): Promise<void> {
		await this.operationRepo.LogOperationFailure('copy lesson', operation.id);
	}
}
