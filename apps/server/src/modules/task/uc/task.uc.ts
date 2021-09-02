import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId, IPagination, Counted, ICurrentUser, SortOrder } from '@shared/domain';
import { CourseRepo } from '@src/repositories';
import { Course } from '@src/entities';

import { TaskRepo, SubmissionRepo } from '../repo';
import { TaskDomainService, TaskWithSubmissionStatus } from '../domain';

enum Permission {
	read,
	write,
}

export enum TaskDashBoardPermission {
	teacherDashboard = 'TASK_DASHBOARD_TEACHER_VIEW_V3',
	studentDashboard = 'TASK_DASHBOARD_VIEW_V3',
}

@Injectable()
export class TaskUC {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly submissionRepo: SubmissionRepo,
		private readonly courseRepo: CourseRepo
	) {}

	// coursegroups are missing
	// lessons are missing -> only search for hidden: false,
	private async findPermittedTaskParents(userId: EntityId, permission: Permission): Promise<Course[]> {
		const [allCourses] = await this.courseRepo.findAllByUserId(userId);

		// !!! Add Authorization service or logic until it is avaible !!!
		const parents = allCourses.filter((c) =>
			permission === Permission.write ? c.hasWritePermission(userId) : !c.hasWritePermission(userId)
		);

		return parents;
	}

	async findAllOpenForStudent(userId: EntityId, pagination: IPagination): Promise<Counted<TaskWithSubmissionStatus[]>> {
		const parents = await this.findPermittedTaskParents(userId, Permission.read);

		const [submissionsOfStudent] = await this.submissionRepo.findAllByUserId(userId);
		const taskIdsWithSubmissions = [...new Set(submissionsOfStudent.map((submission) => submission.task.id))];

		const parentIds = parents.map((parent) => parent.id);

		const [tasks, total] = await this.taskRepo.findAllCurrentIgnoreIds(parentIds, taskIdsWithSubmissions, {
			pagination,
			order: { dueDate: SortOrder.asc },
		});

		const domain = new TaskDomainService(tasks, parents);
		const computedTasks = domain.computeStatusForStudents(submissionsOfStudent);

		return [computedTasks, total];
	}

	async findAllCompletedForStudent(
		userId: EntityId,
		pagination: IPagination
	): Promise<Counted<TaskWithSubmissionStatus[]>> {
		const parents = await this.findPermittedTaskParents(userId, Permission.read);

		const [submissionsOfStudent] = await this.submissionRepo.findAllByUserId(userId);
		const taskIdsWithSubmissions = [...new Set(submissionsOfStudent.map((submission) => submission.task.id))];

		const parentIds = parents.map((course) => course.id);

		const [tasks, total] = await this.taskRepo.findAllCurrentByIds(parentIds, taskIdsWithSubmissions, {
			pagination,
			order: { dueDate: SortOrder.asc },
		});

		const domain = new TaskDomainService(tasks, parents);
		const computedTasks = domain.computeStatusForStudents(submissionsOfStudent);

		return [computedTasks, total];
	}

	// TODO: rename teacher and student
	async findAllOpenForTeacher(userId: EntityId, pagination: IPagination): Promise<Counted<TaskWithSubmissionStatus[]>> {
		const parents = await this.findPermittedTaskParents(userId, Permission.write);

		const parentIds = parents.map((parent) => parent.id);

		const [tasks, total] = await this.taskRepo.findAll(parentIds, { pagination, order: { createdAt: SortOrder.desc } });
		const [submissionsOfTeacher] = await this.submissionRepo.findAllByTaskIds(tasks.map((o) => o.id));

		const domain = new TaskDomainService(tasks, parents);
		const computedTasks = domain.computeStatusForTeachers(submissionsOfTeacher);

		return [computedTasks, total];
	}

	async findAllOpen(currentUser: ICurrentUser, pagination: IPagination): Promise<Counted<TaskWithSubmissionStatus[]>> {
		let response: Counted<TaskWithSubmissionStatus[]>;

		if (this.hasTaskDashboardPermission(currentUser, TaskDashBoardPermission.teacherDashboard)) {
			response = await this.findAllOpenForTeacher(currentUser.userId, pagination);
		} else if (this.hasTaskDashboardPermission(currentUser, TaskDashBoardPermission.studentDashboard)) {
			response = await this.findAllOpenForStudent(currentUser.userId, pagination);
		} else {
			throw new UnauthorizedException();
		}

		return response;
	}

	async findAllCompleted(
		currentUser: ICurrentUser,
		pagination: IPagination
	): Promise<Counted<TaskWithSubmissionStatus[]>> {
		let response: Counted<TaskWithSubmissionStatus[]>;

		if (this.hasTaskDashboardPermission(currentUser, TaskDashBoardPermission.studentDashboard)) {
			response = await this.findAllCompletedForStudent(currentUser.userId, pagination);
		} else {
			throw new UnauthorizedException();
		}

		return response;
	}

	private hasTaskDashboardPermission(currentUser: ICurrentUser, permission: TaskDashBoardPermission): boolean {
		const hasPermission = currentUser.user.permissions.includes(permission);
		return hasPermission;
	}
}
