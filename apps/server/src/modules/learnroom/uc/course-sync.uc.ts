import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Group, GroupService } from '@modules/group';
import { Injectable } from '@nestjs/common';
import { type User as UserEntity } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { School, SchoolService } from '../../school';
import { CourseRequestContext } from '../controller/dto/interface/course-request-context.enum';
import { Course } from '../domain';
import { CourseDoService } from '../service';

@Injectable()
export class CourseSyncUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly courseService: CourseDoService,
		private readonly groupService: GroupService,
		private readonly schoolService: SchoolService
	) {}

	public async stopSynchronization(userId: EntityId, courseId: EntityId): Promise<void> {
		const course: Course = await this.courseService.findById(courseId);

		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(
			user,
			course,
			AuthorizationContextBuilder.write([Permission.COURSE_EDIT])
		);

		await this.courseService.stopSynchronization(course);
	}

	public async startSynchronization(
		userId: string,
		courseId: string,
		groupId: string,
		calledFrom?: CourseRequestContext
	) {
		const course: Course = await this.courseService.findById(courseId);
		const group: Group = await this.groupService.findById(groupId);
		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);
		const school: School = await this.schoolService.getSchoolById(user.school.id);
		if (!calledFrom || calledFrom === CourseRequestContext.COURSE_ADMIN_OVERVIEW) {
			this.authorizationService.checkPermission(
				user,
				school,
				AuthorizationContextBuilder.write([Permission.COURSE_LIST])
			);
		} else if (calledFrom === CourseRequestContext.COURSE_OVERVIEW) {
			this.authorizationService.checkPermission(
				user,
				course,
				AuthorizationContextBuilder.write([Permission.COURSE_EDIT])
			);
		}

		await this.courseService.startSynchronization(course, group);
	}
}
