import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface/permission.enum';
import { EntityId } from '@shared/domain/types/entity-id';
import { AuthorizationContextBuilder } from '@src/modules/authorization/authorization-context.builder';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { LessonService } from '../service/lesson.service';

@Injectable()
export class LessonUC {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly lessonService: LessonService
	) {}

	async delete(userId: EntityId, lessonId: EntityId) {
		const [user, lesson] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.lessonService.findById(lessonId),
		]);

		// Check by Permission.TOPIC_VIEW because the student doesn't have Permission.TOPIC_EDIT
		// is required for CourseGroup lessons
		this.authorizationService.checkPermission(user, lesson, AuthorizationContextBuilder.write([Permission.TOPIC_VIEW]));

		await this.lessonService.deleteLesson(lesson);

		return true;
	}
}
