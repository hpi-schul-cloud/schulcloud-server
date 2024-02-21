import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { LessonEntity } from '@shared/domain/entity';
import { CourseService } from '@modules/learnroom/service/course.service';
import { LessonService } from '../service';

@Injectable()
export class LessonUC {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly lessonService: LessonService,
		private readonly courseService: CourseService
	) {}

	async delete(userId: EntityId, lessonId: EntityId): Promise<boolean> {
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

	async getLessons(userId: EntityId, courseId: EntityId): Promise<LessonEntity[]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const course = await this.courseService.findOneForUser(courseId, userId);

		this.authorizationService.checkPermission(user, course, AuthorizationContextBuilder.read([Permission.COURSE_VIEW]));

		const [lessons] = await this.lessonService.findByCourseIds([courseId]);
		const filteredLessons = lessons.filter((lesson) =>
			this.authorizationService.hasPermission(user, lesson, AuthorizationContextBuilder.read([Permission.TOPIC_VIEW]))
		);

		return filteredLessons;
	}
}
