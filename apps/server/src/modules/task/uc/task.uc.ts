import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
	Counted,
	Course,
	EntityId,
	IPagination,
	ITaskCreate,
	ITaskStatus,
	ITaskUpdate,
	Lesson,
	Permission,
	SortOrder,
	TaskWithStatusVo,
	User,
} from '@shared/domain';
import { CourseRepo, LessonRepo, TaskRepo } from '@shared/repo';
import { Action, AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { TaskService } from '../service';

@Injectable()
export class TaskUC {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly authorizationService: AuthorizationService,
		private readonly courseRepo: CourseRepo,
		private readonly lessonRepo: LessonRepo,
		private readonly taskService: TaskService
	) {}

	async findAllFinished(userId: EntityId, pagination?: IPagination): Promise<Counted<TaskWithStatusVo[]>> {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		this.authorizationService.checkOneOfPermissions(user, [
			Permission.TASK_DASHBOARD_TEACHER_VIEW_V3,
			Permission.TASK_DASHBOARD_VIEW_V3,
		]);

		const courses = await this.getPermittedCourses(user, Action.read);
		const lessons = await this.getPermittedLessons(user, courses);

		const openCourseIds = courses.filter((c) => !c.isFinished()).map((c) => c.id);
		const finishedCourseIds = courses.filter((c) => c.isFinished()).map((c) => c.id);
		const lessonIdsOfOpenCourses = lessons.filter((l) => !l.course.isFinished()).map((l) => l.id);
		const lessonIdsOfFinishedCourses = lessons.filter((l) => l.course.isFinished()).map((l) => l.id);

		let filters = {};
		if (!this.authorizationService.hasAllPermissions(user, [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3])) {
			filters = { userId: user.id };
		}

		const [tasks, total] = await this.taskRepo.findAllFinishedByParentIds(
			{
				creatorId: userId,
				openCourseIds,
				finishedCourseIds,
				lessonIdsOfOpenCourses,
				lessonIdsOfFinishedCourses,
			},
			filters,
			{ pagination, order: { dueDate: SortOrder.desc } }
		);

		const taskWithStatusVos = tasks.map((task) => {
			let status: ITaskStatus;
			if (this.authorizationService.hasPermission(user, task, AuthorizationContextBuilder.write([]))) {
				status = task.createTeacherStatusForUser(user);
			} else {
				status = task.createStudentStatusForUser(user);
			}

			return new TaskWithStatusVo(task, status);
		});

		return [taskWithStatusVos, total];
	}

	async findAll(userId: EntityId, pagination: IPagination): Promise<Counted<TaskWithStatusVo[]>> {
		let response: Counted<TaskWithStatusVo[]>;

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

	async find(userId: EntityId, taskId: EntityId): Promise<TaskWithStatusVo> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const task = await this.taskService.findById(taskId);
		this.authorizationService.checkPermission(user, task, AuthorizationContextBuilder.read([Permission.HOMEWORK_VIEW]));

		const status = this.authorizationService.hasOneOfPermissions(user, [Permission.HOMEWORK_EDIT])
			? task.createTeacherStatusForUser(user)
			: task.createStudentStatusForUser(user);

		const result = new TaskWithStatusVo(task, status);

		return result;
	}

	async changeFinishedForUser(userId: EntityId, taskId: EntityId, isFinished: boolean): Promise<TaskWithStatusVo> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const task = await this.taskRepo.findById(taskId);

		this.authorizationService.checkPermission(user, task, AuthorizationContextBuilder.read([]));

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

	async revertPublished(userId: EntityId, taskId: EntityId): Promise<TaskWithStatusVo> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const task = await this.taskRepo.findById(taskId);

		this.authorizationService.checkPermission(user, task, AuthorizationContextBuilder.write([]));

		task.unpublish();
		await this.taskRepo.save(task);

		const status = task.createTeacherStatusForUser(user);

		const result = new TaskWithStatusVo(task, status);

		return result;
	}

	private async findAllForStudent(user: User, pagination: IPagination): Promise<Counted<TaskWithStatusVo[]>> {
		const courses = await this.getPermittedCourses(user, Action.read);
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
			{ afterDueDateOrNone: dueDate, finished: notFinished, availableOn: new Date(), userId: user.id },
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
		const courses = await this.getPermittedCourses(user, Action.write);
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
	private async getPermittedCourses(user: User, neededPermission: Action): Promise<Course[]> {
		let permittedCourses: Course[] = [];

		if (neededPermission === Action.write) {
			[permittedCourses] = await this.courseRepo.findAllForTeacherOrSubstituteTeacher(user.id);
		} else if (neededPermission === Action.read) {
			[permittedCourses] = await this.courseRepo.findAllByUserId(user.id);
		}

		return permittedCourses;
	}

	private async getPermittedLessons(user: User, courses: Course[]): Promise<Lesson[]> {
		const writeCourses = courses.filter((c) =>
			this.authorizationService.hasPermission(user, c, AuthorizationContextBuilder.write([]))
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

	async delete(userId: EntityId, taskId: EntityId): Promise<boolean> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const task = await this.taskRepo.findById(taskId);

		this.authorizationService.checkPermission(user, task, AuthorizationContextBuilder.write([]));

		await this.taskService.delete(task);

		return true;
	}

	async create(userId: EntityId, params: ITaskCreate): Promise<TaskWithStatusVo> {
		return this.taskService.create(userId, params);
	}

	async update(userId: EntityId, taskId: EntityId, params: ITaskUpdate): Promise<TaskWithStatusVo> {
		return this.taskService.update(userId, taskId, params, true);
	}
}
