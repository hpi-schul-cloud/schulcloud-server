import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId, IPagination, Counted, SortOrder, TaskWithStatusVo, ITaskStatus, User, Task } from '@shared/domain';

import { TaskRepo, UserRepo } from '@shared/repo';

import { TaskAuthorizationService, TaskParentPermission, TaskDashBoardPermission } from './task.authorization.service';

@Injectable()
export class TaskUC {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly authorizationService: TaskAuthorizationService,
		private readonly userRepo: UserRepo
	) {}

	async findAllFinished(userId: EntityId, pagination?: IPagination): Promise<Counted<TaskWithStatusVo[]>> {
		// load the user including all roles
		const user = await this.userRepo.findById(userId, true);

		if (
			!this.authorizationService.hasOneOfTaskDashboardPermissions(user, [
				TaskDashBoardPermission.teacherDashboard,
				TaskDashBoardPermission.studentDashboard,
			])
		) {
			throw new UnauthorizedException();
		}

		const courses = await this.authorizationService.getPermittedCourses(user, TaskParentPermission.read);
		const lessons = await this.authorizationService.getPermittedLessons(user, courses);

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
			{ pagination }
		);

		const taskWithStatusVos = tasks.map((task) => {
			let status: ITaskStatus;
			if (this.authorizationService.hasTaskPermission(user, task, TaskParentPermission.write)) {
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
		const user = await this.userRepo.findById(userId, true);

		if (this.authorizationService.hasOneOfTaskDashboardPermissions(user, TaskDashBoardPermission.studentDashboard)) {
			response = await this.findAllForStudent(user, pagination);
		} else if (
			this.authorizationService.hasOneOfTaskDashboardPermissions(user, TaskDashBoardPermission.teacherDashboard)
		) {
			response = await this.findAllForTeacher(user, pagination);
		} else {
			throw new UnauthorizedException();
		}

		return response;
	}

	async changeFinishedForUser(userId: EntityId, taskId: EntityId, isFinished: boolean): Promise<TaskWithStatusVo> {
		const [user, task] = await Promise.all([this.userRepo.findById(userId, true), this.taskRepo.findById(taskId)]);

		if (!this.authorizationService.hasTaskPermission(user, task, TaskParentPermission.read)) {
			throw new UnauthorizedException();
		}

		if (isFinished) {
			task.finishForUser(user);
		} else {
			task.restoreForUser(user);
		}
		await this.taskRepo.save(task);

		// add status
		const status = this.authorizationService.hasOneOfTaskDashboardPermissions(
			user,
			TaskDashBoardPermission.teacherDashboard
		)
			? task.createTeacherStatusForUser(user)
			: task.createStudentStatusForUser(user);

		const result = new TaskWithStatusVo(task, status);

		return result;
	}

	private async findAllForStudent(user: User, pagination: IPagination): Promise<Counted<TaskWithStatusVo[]>> {
		const courses = await this.authorizationService.getPermittedCourses(user, TaskParentPermission.read);
		const openCourses = courses.filter((c) => !c.isFinished());
		const lessons = await this.authorizationService.getPermittedLessons(user, openCourses);

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
		const courses = await this.authorizationService.getPermittedCourses(user, TaskParentPermission.write);
		const openCourses = courses.filter((c) => !c.isFinished());
		const lessons = await this.authorizationService.getPermittedLessons(user, openCourses);

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

	private getDefaultMaxDueDate(): Date {
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

		return oneWeekAgo;
	}

	async delete(userId: EntityId, taskId: EntityId) {
		const [user, task] = await Promise.all([this.userRepo.findById(userId, true), this.taskRepo.findById(taskId)]);

		if (!this.authorizationService.hasTaskPermission(user, task, TaskParentPermission.write)) {
			throw new ForbiddenException('USER_HAS_NOT_PERMISSIONS');
		}

		await this.taskRepo.delete(task);
		return true;
	}
}
