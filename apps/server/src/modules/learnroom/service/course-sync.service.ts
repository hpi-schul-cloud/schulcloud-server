import { Group, GroupUser } from '@modules/group';
import { RoleDto, RoleService } from '@modules/role';
import { User } from '@modules/user/repo';
import { Inject, Injectable } from '@nestjs/common';
import { SyncAttribute } from '@shared/domain/entity';
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

	public async startSynchronization(course: Course, group: Group, user: User): Promise<void> {
		if (course.syncedWithGroup) {
			throw new CourseAlreadySynchronizedLoggableException(course.id);
		}

		const teacherRole: RoleDto = await this.roleService.findByName(RoleName.TEACHER);

		const isInCourse: boolean = course.isTeacher(user.id);
		const isTeacherInBoth: boolean = isInCourse && group.isMember(user.id, teacherRole.id);
		const keepsAllTeachers: boolean =
			!isInCourse && course.teachers.every((teacherId: EntityId) => group.isMember(teacherId, teacherRole.id));
		const shouldSyncTeachers: boolean = isTeacherInBoth || keepsAllTeachers;

		if (!shouldSyncTeachers) {
			course.excludeFromSync = [SyncAttribute.TEACHERS];
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
		const [studentRole, teacherRole, substituteTeacherRole] = await Promise.all([
			this.roleService.findByName(RoleName.STUDENT),
			this.roleService.findByName(RoleName.TEACHER),
			this.roleService.findByName(RoleName.GROUPSUBSTITUTIONTEACHER),
		]);

		const studentIds: EntityId[] = group.users
			.filter((user: GroupUser) => user.roleId === studentRole.id)
			.map((student: GroupUser) => student.userId);
		const teacherIds: EntityId[] = group.users
			.filter((user: GroupUser) => user.roleId === teacherRole.id)
			.map((teacher: GroupUser) => teacher.userId);
		const substituteTeacherIds: EntityId[] = group.users
			.filter((user: GroupUser) => user.roleId === substituteTeacherRole.id)
			.map((substituteTeacher: GroupUser) => substituteTeacher.userId);

		for (const course of courses) {
			course.syncedWithGroup = group.id;
			course.startDate = group.validPeriod?.from;
			course.untilDate = group.validPeriod?.until;
			course.classes = [];
			course.groups = [];

			if (oldGroup?.name === course.name) {
				course.name = group.name;
			}

			const excludedFromSync: Set<SyncAttribute> = new Set(course.excludeFromSync || []);

			if (excludedFromSync.has(SyncAttribute.TEACHERS)) {
				course.students = studentIds;
			} else {
				course.teachers = teacherIds.length > 0 ? teacherIds : course.teachers;
				course.students = teacherIds.length > 0 ? studentIds : [];
			}

			// To ensure unique teachers per course, filter out already assigned teachers from the substitution teacher list
			const teacherSet: Set<EntityId> = new Set(course.teachers);
			const filteredSubstituteTeacherIds: string[] = substituteTeacherIds.filter(
				(substituteTeacherId: EntityId) => !teacherSet.has(substituteTeacherId)
			);

			course.substitutionTeachers = filteredSubstituteTeacherIds;
		}

		await this.courseRepo.saveAll(courses);
	}
}
