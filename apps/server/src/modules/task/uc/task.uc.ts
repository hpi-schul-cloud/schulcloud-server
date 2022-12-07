import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import {
	Actions,
	Counted,
	Course,
	EntityId,
	IPagination,
	ITaskCreate,
	ITaskProperties,
	ITaskStatus,
	ITaskUpdate,
	Lesson,
	Permission,
	PermissionContextBuilder,
	SortOrder,
	Task,
	TaskWithStatusVo,
	User,
} from '@shared/domain';
import { CourseRepo, LessonRepo, TaskRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { FileParamBuilder, FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { ValidationError } from '@shared/common';

@Injectable()
export class TaskUC {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly authorizationService: AuthorizationService,
		private readonly courseRepo: CourseRepo,
		private readonly lessonRepo: LessonRepo,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService
	) {}

	async findAllFinished(userId: EntityId, pagination?: IPagination): Promise<Counted<TaskWithStatusVo[]>> {
		// load the user including all roles
		const user = await this.authorizationService.getUserWithPermissions(userId);

		this.authorizationService.checkOneOfPermissions(user, [
			Permission.TASK_DASHBOARD_TEACHER_VIEW_V3,
			Permission.TASK_DASHBOARD_VIEW_V3,
		]);

		const courses = await this.getPermittedCourses(user, Actions.read);
		const lessons = await this.getPermittedLessons(user, courses);

		const openCourseIds = courses.filter((c) => !c.isFinished()).map((c) => c.id);
		const finishedCourseIds = courses.filter((c) => c.isFinished()).map((c) => c.id);
		const lessonIdsOfOpenCourses = lessons.filter((l) => !l.course.isFinished()).map((l) => l.id);
		const lessonIdsOfFinishedCourses = lessons.filter((l) => l.course.isFinished()).map((l) => l.id);

		const [tasks, total] = await this.taskRepo.findAllFinishedByParentIds(
			{
				creatorId: userId,
				openCourseIds,
				finishedCourseIds,
				lessonIdsOfOpenCourses,
				lessonIdsOfFinishedCourses,
			},
			{ pagination, order: { dueDate: SortOrder.desc } }
		);

		const taskWithStatusVos = tasks.map((task) => {
			let status: ITaskStatus;
			if (this.authorizationService.hasPermission(user, task, PermissionContextBuilder.write([]))) {
				status = task.createTeacherStatusForUser(user);
			} else {
				// TaskParentPermission.read check is not needed on this place
				status = task.createStudentStatusForUser(user);
			}

			return new TaskWithStatusVo(task, status);
		});

		return [taskWithStatusVos, total];
	}

	async findAll(userId: EntityId, pagination: IPagination): Promise<Counted<TaskWithStatusVo[]>> {
		let response: Counted<TaskWithStatusVo[]>;

		// load the user including all roles
		const user = await this.authorizationService.getUserWithPermissions(userId);

		if (this.authorizationService.hasAllPermissions(user, [Permission.TASK_DASHBOARD_VIEW_V3])) {
			response = await this.findAllForStudent(user, pagination);
		} else if (this.authorizationService.hasAllPermissions(user, [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3])) {
			response = await this.findAllForTeacher(user, pagination);
		} else {
			throw new UnauthorizedException();
		}

		return response;
	}

	async changeFinishedForUser(userId: EntityId, taskId: EntityId, isFinished: boolean): Promise<TaskWithStatusVo> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const task = await this.taskRepo.findById(taskId);

		this.authorizationService.checkPermission(user, task, PermissionContextBuilder.read([]));

		if (isFinished) {
			task.finishForUser(user);
		} else {
			task.restoreForUser(user);
		}
		await this.taskRepo.save(task);

		// TODO fix student case - why have student as fallback?
		//  should be based on permission too and use this.createStatus() instead
		// add status
		const status = this.authorizationService.hasOneOfPermissions(user, [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3])
			? task.createTeacherStatusForUser(user)
			: task.createStudentStatusForUser(user);

		const result = new TaskWithStatusVo(task, status);

		return result;
	}

	private async findAllForStudent(user: User, pagination: IPagination): Promise<Counted<TaskWithStatusVo[]>> {
		const courses = await this.getPermittedCourses(user, Actions.read);
		const openCourses = courses.filter((c) => !c.isFinished());
		const lessons = await this.getPermittedLessons(user, openCourses);

		const dueDate = this.getDefaultMaxDueDate();
		const notFinished = { userId: user.id, value: false };

		const [tasks, total] = await this.taskRepo.findAllByParentIds(
			{
				creatorId: user.id,
				courseIds: openCourses.map((c) => c.id),
				lessonIds: lessons.map((l) => l.id),
			},
			{ afterDueDateOrNone: dueDate, finished: notFinished, availableOn: new Date() },
			{
				pagination,
				order: { dueDate: SortOrder.asc },
			}
		);

		const taskWithStatusVos = tasks.map((task) => {
			const status = task.createStudentStatusForUser(user);
			return new TaskWithStatusVo(task, status);
		});

		return [taskWithStatusVos, total];
	}

	private async findAllForTeacher(user: User, pagination: IPagination): Promise<Counted<TaskWithStatusVo[]>> {
		const courses = await this.getPermittedCourses(user, Actions.write);
		const openCourses = courses.filter((c) => !c.isFinished());
		const lessons = await this.getPermittedLessons(user, openCourses);

		const notFinished = { userId: user.id, value: false };

		const [tasks, total] = await this.taskRepo.findAllByParentIds(
			{
				creatorId: user.id,
				courseIds: openCourses.map((c) => c.id),
				lessonIds: lessons.map((l) => l.id),
			},
			{ finished: notFinished, availableOn: new Date() },
			{
				pagination,
				order: { dueDate: SortOrder.desc },
			}
		);

		const taskWithStatusVos = tasks.map((task) => {
			const status = task.createTeacherStatusForUser(user);
			return new TaskWithStatusVo(task, status);
		});

		return [taskWithStatusVos, total];
	}

	// it should return also the scopePermissions for this user added to the entity .scopePermission: { userId, read: boolean, write: boolean }
	// then we can pass and allow only scoped courses to getPermittedLessonIds and validate read write of .scopePermission
	private async getPermittedCourses(user: User, neededPermission: Actions): Promise<Course[]> {
		let permittedCourses: Course[] = [];

		if (neededPermission === Actions.write) {
			[permittedCourses] = await this.courseRepo.findAllForTeacher(user.id);
		} else if (neededPermission === Actions.read) {
			[permittedCourses] = await this.courseRepo.findAllByUserId(user.id);
		}

		return permittedCourses;
	}

	private async getPermittedLessons(user: User, courses: Course[]): Promise<Lesson[]> {
		const writeCourses = courses.filter((c) =>
			this.authorizationService.hasPermission(user, c, PermissionContextBuilder.write([]))
		);
		const readCourses = courses.filter((c) => !writeCourses.includes(c));

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

	private getDefaultMaxDueDate(): Date {
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

		return oneWeekAgo;
	}

	async delete(userId: EntityId, taskId: EntityId) {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const task = await this.taskRepo.findById(taskId);

		this.authorizationService.checkPermission(user, task, PermissionContextBuilder.write([]));

		const params = FileParamBuilder.build(task.school.id, task);
		await this.filesStorageClientAdapterService.deleteFilesOfParent(params);

		await this.taskRepo.delete(task);
		return true;
	}
}
