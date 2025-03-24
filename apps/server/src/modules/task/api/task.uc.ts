import { Action, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { CourseService } from '@modules/course';
import { CourseEntity } from '@modules/course/repo';
import { LessonService } from '@modules/lesson';
import { LessonEntity } from '@modules/lesson/repo';
import { User } from '@modules/user/repo';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Pagination, Permission, SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { TaskService, TaskStatus } from '../domain';
import { TaskRepo, TaskWithStatusVo } from '../repo';
@Injectable()
export class TaskUC {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly authorizationService: AuthorizationService,
		private readonly courseService: CourseService,
		private readonly lessonService: LessonService,
		private readonly taskService: TaskService
	) {}

	public async findAllFinished(userId: EntityId, pagination?: Pagination): Promise<Counted<TaskWithStatusVo[]>> {
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
			let status: TaskStatus;
			if (this.authorizationService.hasPermission(user, task, AuthorizationContextBuilder.write([]))) {
				status = task.createTeacherStatusForUser(user);
			} else {
				status = task.createStudentStatusForUser(user);
			}

			return new TaskWithStatusVo(task, status);
		});

		return [taskWithStatusVos, total];
	}

	public async findAll(userId: EntityId, pagination: Pagination): Promise<Counted<TaskWithStatusVo[]>> {
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

	public async changeFinishedForUser(
		userId: EntityId,
		taskId: EntityId,
		isFinished: boolean
	): Promise<TaskWithStatusVo> {
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

	public async revertPublished(userId: EntityId, taskId: EntityId): Promise<TaskWithStatusVo> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const task = await this.taskRepo.findById(taskId);

		this.authorizationService.checkPermission(user, task, AuthorizationContextBuilder.write([]));

		task.unpublish();
		await this.taskRepo.save(task);

		const status = task.createTeacherStatusForUser(user);

		const result = new TaskWithStatusVo(task, status);

		return result;
	}

	private async findAllForStudent(user: User, pagination: Pagination): Promise<Counted<TaskWithStatusVo[]>> {
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

	private async findAllForTeacher(user: User, pagination: Pagination): Promise<Counted<TaskWithStatusVo[]>> {
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
	private async getPermittedCourses(user: User, neededPermission: Action): Promise<CourseEntity[]> {
		let permittedCourses: CourseEntity[] = [];

		if (neededPermission === Action.write) {
			permittedCourses = await this.courseService.findAllForTeacherOrSubstituteTeacher(user.id);
		} else if (neededPermission === Action.read) {
			permittedCourses = await this.courseService.findAllByUserId(user.id);
		}

		return permittedCourses;
	}

	private async getPermittedLessons(user: User, courses: CourseEntity[]): Promise<LessonEntity[]> {
		const writeCourses = courses.filter((c) =>
			this.authorizationService.hasPermission(user, c, AuthorizationContextBuilder.write([]))
		);
		const readCourses = courses.filter((c) => !writeCourses.includes(c));

		const writeCourseIds = writeCourses.map((c) => c.id);
		const readCourseIds = readCourses.map((c) => c.id);

		// idea as combined query:
		// [{courseIds: onlyWriteCoursesIds}, { courseIds: onlyReadCourses, filter: { hidden: false }}]
		const [[writeLessons], [readLessons]] = await Promise.all([
			this.lessonService.findByCourseIds(writeCourseIds),
			this.lessonService.findByCourseIds(readCourseIds, { hidden: false }),
		]);

		const permittedLessons = [...writeLessons, ...readLessons];

		return permittedLessons;
	}

	private getDefaultMaxDueDate(): Date {
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

		return oneWeekAgo;
	}

	public async delete(userId: EntityId, taskId: EntityId): Promise<boolean> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const task = await this.taskRepo.findById(taskId);

		this.authorizationService.checkPermission(user, task, AuthorizationContextBuilder.write([]));

		await this.taskService.delete(task);

		return true;
	}
}
