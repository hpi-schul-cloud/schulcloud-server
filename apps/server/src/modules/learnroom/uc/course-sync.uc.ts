import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Group, GroupService, GroupUser } from '@modules/group';
import { Injectable } from '@nestjs/common';
import { RoleDto, RoleService } from '@modules/role';

import { type User as UserEntity } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Course } from '../domain';
import { CourseDoService } from '../service';

@Injectable()
export class CourseSyncUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly courseService: CourseDoService,
		private readonly groupService: GroupService,
		private readonly roleService: RoleService
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
		const [course, group, user] = await Promise.all([
			this.courseService.findById(courseId),
			this.groupService.findById(groupId),
			this.authorizationService.getUserWithPermissions(userId),
		]);

		this.authorizationService.checkPermission(
			user,
			course,
			AuthorizationContextBuilder.write([Permission.COURSE_EDIT])
		);

		const [studentRole, teacherRole] = await Promise.all([
			this.roleService.findByName(RoleName.STUDENT),
			this.roleService.findByName(RoleName.TEACHER),
		]);

		const students = group.users.filter((groupUser: GroupUser) => groupUser.roleId === studentRole.id);
		const teachers = group.users.filter((groupUser: GroupUser) => groupUser.roleId === teacherRole.id);

		await this.courseService.startSynchronization(course, group, students, teachers);
	}
}
