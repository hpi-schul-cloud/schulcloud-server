import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId, IPagination, Counted, ICurrentUser, SortOrder, TaskWithStatusVo, Task } from '@shared/domain';

import { TaskRepo } from '@shared/repo';

import { TaskAuthorizationService, TaskParentPermission } from './task.authorization.service';

export enum TaskDashBoardPermission {
	teacherDashboard = 'TASK_DASHBOARD_TEACHER_VIEW_V3',
	studentDashboard = 'TASK_DASHBOARD_VIEW_V3',
}

@Injectable()
export class TaskUC {
	constructor(private readonly taskRepo: TaskRepo, private readonly authorizationService: TaskAuthorizationService) {}

	async findAllFinished(userId: EntityId, pagination?: IPagination): Promise<Counted<Task[]>> {
		const courseIds = await this.authorizationService.getPermittedCourseIds(userId, TaskParentPermission.read);
		const lessonIds = await this.authorizationService.getPermittedLessonIds(userId, courseIds);

		// TODO: + all task of courses where duedate is arrived
		const [finishedTasks, count] = await this.taskRepo.findAllByParentIds(
			{ courseIds, lessonIds },
			{ closed: userId },
			{ pagination }
		);

		return [finishedTasks, count];
	}

	// TODO replace curentUser with userId. this requires that permissions are loaded inside the use case by authorization service
	// TODO: use authorizationService instant of private method
	async findAll(currentUser: ICurrentUser, pagination: IPagination): Promise<Counted<TaskWithStatusVo[]>> {
		let response: Counted<TaskWithStatusVo[]>;

		if (this.hasTaskDashboardPermission(currentUser, TaskDashBoardPermission.studentDashboard)) {
			response = await this.findAllForStudent(currentUser.userId, pagination);
		} else if (this.hasTaskDashboardPermission(currentUser, TaskDashBoardPermission.teacherDashboard)) {
			response = await this.findAllForTeacher(currentUser.userId, pagination);
		} else {
			throw new UnauthorizedException();
		}

		return response;
	}

	private async findAllForStudent(userId: EntityId, pagination: IPagination): Promise<Counted<TaskWithStatusVo[]>> {
		const courseIds = await this.authorizationService.getPermittedCourseIds(userId, TaskParentPermission.read);
		const lessonIds = await this.authorizationService.getPermittedLessonIds(userId, courseIds);
		const dueDate = this.getDefaultMaxDueDate();

		const [tasks, total] = await this.taskRepo.findAllByParentIds(
			{
				courseIds,
				lessonIds,
			},
			{ draft: false, afterDueDateOrNone: dueDate, excludeClosed: userId },
			{
				pagination,
				order: { dueDate: SortOrder.asc },
			}
		);

		const taskWithStatusVos = tasks.map((task) => {
			const status = task.createStudentStatusForUser(userId);
			return new TaskWithStatusVo(task, status);
		});

		return [taskWithStatusVos, total];
	}

	private async findAllForTeacher(userId: EntityId, pagination: IPagination): Promise<Counted<TaskWithStatusVo[]>> {
		const courseIds = await this.authorizationService.getPermittedCourseIds(userId, TaskParentPermission.write);
		const lessonIds = await this.authorizationService.getPermittedLessonIds(userId, courseIds);

		const [tasks, total] = await this.taskRepo.findAllByParentIds(
			{
				teacherId: userId,
				courseIds,
				lessonIds,
			},
			{ excludeClosed: userId },
			{
				pagination,
				order: { dueDate: SortOrder.desc },
			}
		);

		const taskWithStatusVos = tasks.map((task) => {
			const status = task.createTeacherStatusForUser(userId);
			return new TaskWithStatusVo(task, status);
		});

		return [taskWithStatusVos, total];
	}

	private hasTaskDashboardPermission(currentUser: ICurrentUser, permission: TaskDashBoardPermission): boolean {
		const hasPermission = currentUser.user.permissions.includes(permission);
		return hasPermission;
	}

	// It is more a util method or domain logic in context of findAllForStudent timeframe
	private getDefaultMaxDueDate(): Date {
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
		return oneWeekAgo;
	}
}
