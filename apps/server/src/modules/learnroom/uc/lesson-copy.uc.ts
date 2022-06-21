import { Injectable, ForbiddenException } from '@nestjs/common';
import { CopyStatus, Lesson, EntityId, LessonCopyService, PermissionContextBuilder } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { LessonRepo } from '@shared/repo';

@Injectable()
export class LessonCopyUc {
	constructor(
		private readonly authorisation: AuthorizationService,
		private readonly lessonCopyService: LessonCopyService,
		private readonly lessonRepo: LessonRepo
	) {}

	async copyLesson(userId: EntityId, lessonId: EntityId): Promise<CopyStatus> {
		const user = await this.authorisation.getUserWithPermissions(userId);
		const originalLesson = await this.lessonRepo.findById(lessonId);
		const context = PermissionContextBuilder.read([]);
		if (!this.authorisation.hasPermission(user, originalLesson, context)) {
			throw new ForbiddenException('could not find lesson to copy');
		}
		const status = this.lessonCopyService.copyLesson({
			originalLesson,
			destinationCourse: originalLesson.course,
			user,
		});

		if (status.copyEntity) {
			const lessonCopy = status.copyEntity as Lesson;
			await this.lessonRepo.save(lessonCopy);
		}

		return status;
	}
}
