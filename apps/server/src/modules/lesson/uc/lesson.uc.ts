import { Injectable } from '@nestjs/common';
import { EntityId, Permission, AuthorizationContextBuilder } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { LessonService } from '../service';

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

		this.authorizationService.checkPermission(user, lesson, AuthorizationContextBuilder.write([Permission.TOPIC_EDIT]));

		await this.lessonService.deleteLesson(lesson);

		return true;
	}
}
