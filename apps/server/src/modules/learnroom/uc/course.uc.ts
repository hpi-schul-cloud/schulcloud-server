import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PaginationParams } from '@shared/controller/';
import { Counted, Course, EntityId, Permission, SortOrder } from '@shared/domain';
import { CourseRepo } from '@shared/repo';
import { AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';

@Injectable()
export class CourseUc {
	constructor(
		private readonly courseRepo: CourseRepo,
		@Inject(forwardRef(() => AuthorizationService))
		private readonly authorizationService: AuthorizationService
	) {}

	findAllByUser(userId: EntityId, options?: PaginationParams): Promise<Counted<Course[]>> {
		return this.courseRepo.findAllByUserId(userId, {}, { pagination: options, order: { updatedAt: SortOrder.desc } });
	}

	public async getCourse(userId: EntityId, courseId: EntityId) {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const course = await this.courseRepo.findOneForTeacherOrSubstituteTeacher(userId, courseId);

		this.authorizationService.checkPermission(
			user,
			course,
			AuthorizationContextBuilder.write([Permission.COURSE_EDIT])
		);

		return course;
	}
}
