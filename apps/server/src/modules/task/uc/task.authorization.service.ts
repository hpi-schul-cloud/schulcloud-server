import { Injectable } from '@nestjs/common';
import { EntityId, Course, Lesson, Task, User } from '@shared/domain';
import { CourseRepo, LessonRepo, RoleRepo } from '@shared/repo';

export enum TaskParentPermission {
	read,
	write,
}

export enum TaskDashBoardPermission {
	teacherDashboard = 'TASK_DASHBOARD_TEACHER_VIEW_V3',
	studentDashboard = 'TASK_DASHBOARD_VIEW_V3',
}

@Injectable()
export class TaskAuthorizationService {
	constructor(
		private readonly courseRepo: CourseRepo,
		private readonly lessonRepo: LessonRepo,
		private readonly roleRepo: RoleRepo
	) {}

	// it should return also the scopePermissions for this user added to the entity .scopePermission: { userId, read: boolean, write: boolean }
	// then we can pass and allow only scoped courses to getPermittedLessonIds and validate read write of .scopePermission
	async getPermittedCourses(userId: EntityId, neededPermission: TaskParentPermission): Promise<Course[]> {
		let permittedCourses: Course[] = [];

		if (neededPermission === TaskParentPermission.write) {
			[permittedCourses] = await this.courseRepo.findAllForTeacher(userId);
		} else if (neededPermission === TaskParentPermission.read) {
			[permittedCourses] = await this.courseRepo.findAllByUserId(userId);
		}

		return permittedCourses;
	}

	async getPermittedLessons(userId: EntityId, courses: Course[]): Promise<Lesson[]> {
		const writeCourses = courses.filter((c) => this.hasCourseWritePermission(userId, c));
		const readCourses = courses.filter((c) => this.hasCourseReadPermission(userId, c));

		const writeCourseIds = writeCourses.map((c) => c.id);
		const readCourseIds = readCourses.map((c) => c.id);

		// idea as combined query:
		// [{courseIds: onlyWriteCoursesIds}, { courseIds: onlyReadCourses, filter: { hidden: false }}]
		const [[writeLessons], [readLessons]] = await Promise.all([
			this.lessonRepo.findAllByCourseIds(writeCourseIds),
			this.lessonRepo.findAllByCourseIds(readCourseIds, { hidden: false }),
		]);

		const permittedLessons = [...writeLessons, ...readLessons];

		return permittedLessons;
	}

	private hasCourseWritePermission(userId: EntityId, course?: Course): boolean {
		const hasPermission =
			course?.getSubstitutionTeacherIds().includes(userId) === true ||
			course?.getTeacherIds().includes(userId) === true;

		return hasPermission;
	}

	private hasCourseReadPermission(userId: EntityId, course?: Course): boolean {
		const hasPermission = course?.getStudentIds().includes(userId) === true;

		return hasPermission;
	}

	hasTaskPermission(userId: EntityId, task: Task, permission: TaskParentPermission): boolean {
		const isCreator = task.creator?.id === userId;
		let hasCoursePermission = false;

		if (permission === TaskParentPermission.write) {
			hasCoursePermission = this.hasCourseWritePermission(userId, task.course);
		} else if (permission === TaskParentPermission.read) {
			hasCoursePermission =
				this.hasCourseReadPermission(userId, task.course) || this.hasCourseWritePermission(userId, task.course);
		}

		const hasPermission = isCreator || hasCoursePermission;

		return hasPermission;
	}

	async hasTaskDashboardPermission(user: User, permission: TaskDashBoardPermission): Promise<boolean> {
		const permissions = await this.roleRepo.resolvePermissionsByRoles(user.roles.getItems());

		const hasPermission = permissions.includes(permission);

		return hasPermission;
	}
}
