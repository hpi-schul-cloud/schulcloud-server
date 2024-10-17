import { Group, GroupUser } from '@modules/group';
import { RoleService } from '@modules/role';
import { Inject, Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import {
	Course,
	COURSE_REPO,
	CourseAlreadySynchronizedLoggableException,
	CourseNotSynchronizedLoggableException,
	CourseRepo,
} from '../domain';

@Injectable()
export class CourseSyncService {
	constructor(
		@Inject(COURSE_REPO) private readonly courseRepo: CourseRepo,
		private readonly roleService: RoleService
	) {}

	public async startSynchronization(course: Course, group: Group): Promise<void> {
		if (course.syncedWithGroup) {
			throw new CourseAlreadySynchronizedLoggableException(course.id);
		}

		await this.synchronize([course], group);
	}

	public async stopSynchronization(course: Course): Promise<void> {
		if (!course.syncedWithGroup) {
			throw new CourseNotSynchronizedLoggableException(course.id);
		}

		course.syncedWithGroup = undefined;

		await this.courseRepo.save(course);
	}

	public async synchronizeCourseWithGroup(newGroup: Group, oldGroup?: Group): Promise<void> {
		const courses: Course[] = await this.courseRepo.findBySyncedGroup(newGroup);
		await this.synchronize(courses, newGroup, oldGroup);
	}

	private async synchronize(courses: Course[], group: Group, oldGroup?: Group): Promise<void> {
		if (courses.length) {
			const [studentRole, teacherRole] = await Promise.all([
				this.roleService.findByName(RoleName.STUDENT),
				this.roleService.findByName(RoleName.TEACHER),
			]);
			const students = group.users.filter((groupUser: GroupUser) => groupUser.roleId === studentRole.id);
			const teachers = group.users.filter((groupUser: GroupUser) => groupUser.roleId === teacherRole.id);

			const coursesToSync = courses.map((course) => {
				course.syncedWithGroup = group.id;
				if (oldGroup && oldGroup.name === course.name) {
					course.name = group.name;
				}
				course.startDate = group.validPeriod?.from;
				course.untilDate = group.validPeriod?.until;

				if (teachers.length >= 1) {
					course.students = students.map((user: GroupUser): EntityId => user.userId);
					course.teachers = teachers.map((user: GroupUser): EntityId => user.userId);
				} else {
					course.students = [];
				}

				course.classes = [];
				course.groups = [];

				return course;
			});

			await this.courseRepo.saveAll(coursesToSync);
		}
	}
}
