import { Injectable } from '@nestjs/common';
import { PaginationParams } from '@shared/controller/';
import { Counted, Course, EntityId, Permission, PermissionContextBuilder, SortOrder } from '@shared/domain';
import { CourseRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';

@Injectable()
export class CourseUc {
	constructor(private readonly courseRepo: CourseRepo, private readonly authorizationService: AuthorizationService) {}

	findAllByUser(userId: EntityId, options?: PaginationParams): Promise<Counted<Course[]>> {
		return this.courseRepo.findAllByUserId(userId, {}, { pagination: options, order: { updatedAt: SortOrder.desc } });
	}

	public async getCourse(userId: EntityId, courseId: EntityId) {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const course = await this.courseRepo.findOneForTeacherOrSubstituteTeacher(userId, courseId);

		this.authorizationService.checkPermission(user, course, PermissionContextBuilder.write([Permission.COURSE_EDIT]));

		return course;
	}
}
