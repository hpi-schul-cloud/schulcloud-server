import { Group, GroupUser } from '@modules/group';
import { CourseDoService } from '@modules/learnroom/service/course-do.service';
import { RoleDto, RoleService } from '@modules/role';
import { Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Course } from '@src/modules/learnroom/domain';

@Injectable()
export class SchulconnexCourseSyncService {
	constructor(private readonly courseService: CourseDoService, private readonly roleService: RoleService) {}

	async synchronizeCourseWithGroup(newGroup: Group, oldGroup?: Group): Promise<void> {
		const courses: Course[] = await this.courseService.findBySyncedGroup(newGroup);

		if (courses.length) {
			const studentRole: RoleDto = await this.roleService.findByName(RoleName.STUDENT);
			const teacherRole: RoleDto = await this.roleService.findByName(RoleName.TEACHER);

			courses.forEach((course: Course): void => {
				if (!oldGroup || oldGroup.name === course.name) {
					course.name = newGroup.name;
				}

				const students: GroupUser[] = newGroup.users.filter(
					(user: GroupUser): boolean => user.roleId === studentRole.id
				);
				const teachers: GroupUser[] = newGroup.users.filter(
					(user: GroupUser): boolean => user.roleId === teacherRole.id
				);

				if (teachers.length >= 1) {
					course.students = students.map((user: GroupUser): EntityId => user.userId);
					course.teachers = teachers.map((user: GroupUser): EntityId => user.userId);
				} else {
					// Remove all remaining students and break the link, when the last teacher of the group should be removed
					course.students = [];
					course.syncedWithGroup = undefined;
				}
			});

			await this.courseService.saveAll(courses);
		}
	}
}
