import { Injectable } from '@nestjs/common';
import { EntityId, PermissionContextBuilder } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { LessonService } from '../service';

@Injectable()
export class LessonUC {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly lessonService: LessonService
	) {}

	async delete(userId: EntityId, lessonId: EntityId, jwt: string) {
		const [user, lesson] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.lessonService.findById(lessonId),
		]);

		this.authorizationService.checkPermission(user, lesson, PermissionContextBuilder.write([]));

		await this.lessonService.deleteLesson(lesson, jwt);

		return true;
	}
}
