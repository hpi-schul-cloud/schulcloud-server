import { Group, GroupUser } from '@modules/group';
import { RoleService } from '@modules/role';
import { Inject, Injectable } from '@nestjs/common';
import { Role, SyncAttribute, User } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
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

	public async startSynchronization(course: Course, group: Group, user: User): Promise<void> {
		if (course.syncedWithGroup) {
			throw new CourseAlreadySynchronizedLoggableException(course.id);
		}

		const isTeacher = user.getRoles().some((role: Role) => role.name === RoleName.TEACHER);
		const isInGroup = group.users.some((groupUser) => groupUser.userId === user.id);

		if (isTeacher && !isInGroup) {
			course.excludeFromSync = [SyncAttribute.TEACHERS];
			course.teachers = [user.id];
		}

		await this.synchronize([course], group);
	}

	public async stopSynchronization(course: Course): Promise<void> {
		if (!course.syncedWithGroup) {
			throw new CourseNotSynchronizedLoggableException(course.id);
		}

		course.syncedWithGroup = undefined;
		course.excludeFromSync = undefined;

		await this.courseRepo.save(course);
	}

	public async synchronizeCourseWithGroup(newGroup: Group, oldGroup?: Group): Promise<void> {
		const courses: Course[] = await this.courseRepo.findBySyncedGroup(newGroup);
		await this.synchronize(courses, newGroup, oldGroup);
	}

	private async synchronize(courses: Course[], group: Group, oldGroup?: Group): Promise<void> {
		const [studentRole, teacherRole] = await Promise.all([
			this.roleService.findByName(RoleName.STUDENT),
			this.roleService.findByName(RoleName.TEACHER),
		]);

		const studentIds = group.users
			.filter((user: GroupUser) => user.roleId === studentRole.id)
			.map((student) => student.userId);
		const teacherIds = group.users
			.filter((user: GroupUser) => user.roleId === teacherRole.id)
			.map((teacher) => teacher.userId);

		for (const course of courses) {
			course.syncedWithGroup = group.id;
			course.startDate = group.validPeriod?.from;
			course.untilDate = group.validPeriod?.until;
			course.classes = [];
			course.groups = [];

			if (oldGroup?.name === course.name) {
				course.name = group.name;
			}

			const excludedFromSync = new Set(course.excludeFromSync || []);

			if (excludedFromSync.has(SyncAttribute.TEACHERS)) {
				course.students = studentIds;
			} else {
				course.teachers = teacherIds.length > 0 ? teacherIds : course.teachers;
				course.students = teacherIds.length > 0 ? studentIds : [];
			}
		}

		await this.courseRepo.saveAll(courses);
	}
}
