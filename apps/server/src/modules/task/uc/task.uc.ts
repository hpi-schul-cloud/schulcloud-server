import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId, IPagination, Counted, ICurrentUser, SortOrder } from '@shared/domain';

import { TaskRepo } from '../repo';
import { TaskWithStatusVo } from '../entity/task-with-status.vo';
import { Task } from '../entity';
import { TaskAuthorizationService, TaskParentPermission } from './task.authorization.service';

export enum TaskDashBoardPermission {
	teacherDashboard = 'TASK_DASHBOARD_TEACHER_VIEW_V3',
	studentDashboard = 'TASK_DASHBOARD_VIEW_V3',
}
@Injectable()
export class TaskUC {
	constructor(private readonly taskRepo: TaskRepo, private readonly authorizationService: TaskAuthorizationService) {}

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
		const parentIds = await this.authorizationService.getPermittedCourses(userId, TaskParentPermission.read);

		const [tasks, total] = await this.taskRepo.findAllCurrent(parentIds, {
			pagination,
			order: { dueDate: SortOrder.asc },
		});

		const computedTasks = tasks.map((task) => this.computeTaskStatusForStudent(task, userId));

		return [computedTasks, total];
	}

	private async findAllForTeacher(userId: EntityId, pagination: IPagination): Promise<Counted<TaskWithStatusVo[]>> {
		const parentIds = await this.authorizationService.getPermittedCourses(userId, TaskParentPermission.write);

		const [tasks, total] = await this.taskRepo.findAll(parentIds, {
			pagination,
			order: { createdAt: SortOrder.desc },
		});

		const computedTasks = tasks.map((task) => this.computeTaskStatusForTeacher(task));

		return [computedTasks, total];
	}

	private hasTaskDashboardPermission(currentUser: ICurrentUser, permission: TaskDashBoardPermission): boolean {
		const hasPermission = currentUser.user.permissions.includes(permission);
		return hasPermission;
	}

	private computeTaskStatusForStudent(task: Task, userId: EntityId): TaskWithStatusVo {
		const studentSubmissions = task.submissions.getItems().filter((submission) => submission.student.id === userId);

		const submitted = studentSubmissions.length > 0 ? 1 : 0;
		const graded = studentSubmissions.filter((submission) => submission.isGraded()).length;
		const maxSubmissions = 1;

		return new TaskWithStatusVo(task, { submitted, maxSubmissions, graded });
	}

	private computeTaskStatusForTeacher(task: Task): TaskWithStatusVo {
		const submittedStudentIds = task.submissions.getItems().map((submission) => submission.student.id);

		// unique by studentId
		const submitted = [...new Set(submittedStudentIds)].length;

		const gradedStudentIds = task.submissions
			.getItems()
			.filter((submission) => submission.isGraded())
			.map((submission) => submission.student.id);

		// unique by studentId
		const graded = [...new Set(gradedStudentIds)].length;

		const maxSubmissions = task.parent ? task.parent.getNumberOfStudents() : 0;

		return new TaskWithStatusVo(task, { submitted, maxSubmissions, graded });
	}
}
