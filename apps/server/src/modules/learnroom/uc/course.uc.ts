import { Injectable } from '@nestjs/common';
import { Actions, Counted, Course, EntityId, Permission, SortOrder } from '@shared/domain';
import { CourseRepo } from '@shared/repo';
import { PaginationParams } from '@shared/controller/';
import { ImsccFileBuilder } from '@src/modules/learnroom/imscc/imscc-file-builder';
import { Readable } from 'stream';
import { AuthorizationService } from '../../authorization';
import { AllowedAuthorizationEntityType } from '../../authorization/interfaces';

@Injectable()
export class CourseUc {
	constructor(private readonly courseRepo: CourseRepo, private readonly authService: AuthorizationService) {}

	findAllByUser(userId: EntityId, options?: PaginationParams): Promise<Counted<Course[]>> {
		return this.courseRepo.findAllByUserId(userId, {}, { pagination: options, order: { updatedAt: SortOrder.desc } });
	}

	async exportCourse(courseId: EntityId, userId: EntityId): Promise<Readable> {
		await this.authService.checkPermissionByReferences(userId, AllowedAuthorizationEntityType.Course, courseId, {
			action: Actions.read,
			requiredPermissions: [Permission.COURSE_EDIT],
		});
		const course = await this.courseRepo.findOne(courseId, userId);
		return new ImsccFileBuilder().addTitle(course.name).build();
	}
}
