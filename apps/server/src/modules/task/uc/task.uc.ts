import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId, IPagination, Counted, ICurrentUser, SortOrder, TaskWithStatusVo } from '@shared/domain';

import { LessonRepo, TaskRepo } from '@shared/repo';
import { TaskAuthorizationService, TaskParentPermission } from './task.authorization.service';

export enum TaskDashBoardPermission {
	teacherDashboard = 'TASK_DASHBOARD_TEACHER_VIEW_V3',
	studentDashboard = 'TASK_DASHBOARD_VIEW_V3',
}
@Injectable()
export class TaskUC {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly lessonRepo: LessonRepo,
		private readonly authorizationService: TaskAuthorizationService
	) {}

	// TODO replace curentUser with userId. this requires that permissions are loaded inside the use case by authorization service
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
		const courseIds = await this.authorizationService.getPermittedCourses(userId, TaskParentPermission.read);
		const visibleLessons = await this.lessonRepo.findAllByCourseIds(courseIds, { hidden: false });
		const dueDate = this.getDefaultMaxDueDate();

		const [tasks, total] = await this.taskRepo.findAllByParentIds(
			{
				courseIds,
				lessonIds: visibleLessons.map((o) => o.id),
			},
			{ draft: false, afterDueDateOrNone: dueDate, closed: userId },
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
		const courseIds = await this.authorizationService.getPermittedCourses(userId, TaskParentPermission.write);
		const visibleLessons = await this.lessonRepo.findAllByCourseIds(courseIds, { hidden: false });

		const [tasks, total] = await this.taskRepo.findAllByParentIds(
			{
				teacherId: userId,
				courseIds,
				lessonIds: visibleLessons.map((o) => o.id),
			},
			{ closed: userId },
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
