/* istanbul ignore file */
// TODO add tests to improve coverage

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId, IPagination } from '@shared/domain';
import { Counted } from '@shared/domain/types';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { TaskRepo, SubmissionRepo } from '../repo';
import { TaskSubmissionMetadataService } from '../domain/task-submission-metadata.service';
import { ISubmissionStatus, Task } from '../entity';
import { LearnroomFacade } from '../../learnroom';

export type TaskWithSubmissionStatus = {
	task: Task;
	status: ISubmissionStatus;
};

@Injectable()
export class TaskUC {
	permissions = {
		teacherDashboard: 'TASK_DASHBOARD_TEACHER_VIEW_V3',
		studentDashboard: 'TASK_DASHBOARD_VIEW_V3',
	};

	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly submissionRepo: SubmissionRepo,
		private readonly taskSubmissionMetadata: TaskSubmissionMetadataService,
		private readonly learnroomFacade: LearnroomFacade
	) {}

	// TODO: Combine student and teacher logic if it is possible in next iterations
	// TODO: Add for students in status -> student has finished, teacher has answered
	// TODO: After it, the permission check can removed
	async findAllOpenForStudent(userId: EntityId, pagination: IPagination): Promise<Counted<TaskWithSubmissionStatus[]>> {
		// TODO authorization (user conditions -> permissions?)
		// TODO get permitted tasks...
		// TODO have BL from repo here

		const [submissionsOfStudent] = await this.submissionRepo.getAllSubmissionsByUser(userId);
		const tasksWithSubmissions = submissionsOfStudent.map((submission) => submission.task.id);

		const [tasks, total] = await this.taskRepo.findAllByStudent(userId, pagination, tasksWithSubmissions);
		const computedTasks = tasks.map((task) => ({
			task,
			status: this.taskSubmissionMetadata.submissionStatusForTask(submissionsOfStudent, task),
		}));
		return [computedTasks, total];
	}

	async findAllOpenByTeacher(userId: EntityId, pagination: IPagination): Promise<Counted<TaskWithSubmissionStatus[]>> {
		const [tasks, total] = await this.taskRepo.findAllAssignedByTeacher(userId, pagination);
		const [submissions] = await this.submissionRepo.getSubmissionsByTasksList(tasks);

		const computedTasks = tasks.map((task) => {
			const taskSubmissions = submissions.filter((sub) => sub.task === task);
			return {
				task,
				status: this.taskSubmissionMetadata.submissionStatusForTask(taskSubmissions, task),
			};
		});
		return [computedTasks, total];
	}

	async findAllOpen(currentUser: ICurrentUser, pagination: IPagination): Promise<Counted<TaskWithSubmissionStatus[]>> {
		const {
			user: { id, permissions },
		} = currentUser;

		let response: Counted<TaskWithSubmissionStatus[]>;
		if (permissions.includes(this.permissions.teacherDashboard)) {
			response = await this.findAllOpenByTeacher(id, pagination);
		} else if (permissions.includes(this.permissions.studentDashboard)) {
			response = await this.findAllOpenForStudent(id, pagination);
		} else {
			throw new UnauthorizedException();
		}

		return response;
	}
}
