import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { type User as UserEntity } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Group, GroupService } from '@modules/group';
import { Course } from '../domain';
import { CourseDoService } from '../service';

@Injectable()
export class CourseSyncUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly courseService: CourseDoService,
		private readonly groupService: GroupService
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

	public async startSynchronization(userId: string, courseId: string, groupId: string) {
		const course: Course = await this.courseService.findById(courseId);
		const group: Group = await this.groupService.findById(groupId);
		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(
			user,
			course,
			AuthorizationContextBuilder.write([Permission.COURSE_EDIT])
		);

		await this.courseService.startSynchronization(course, group);
	}
}
