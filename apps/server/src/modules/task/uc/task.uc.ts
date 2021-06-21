import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId, IPagination } from '@shared/domain';
import { Counted } from '@shared/domain/types';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { TaskRepo } from '../repo/task.repo';
import { Task, Submission } from '../entity';
import { SubmissionRepo } from '../repo/submission.repo';
import { TaskMapper } from '../mapper/task.mapper';
// TODO: define own type
import { TaskResponse } from '../controller/dto';

// TODO: move to different file and use it in mapper
export type ITaskSubmissionsMetaData = { submitted: number; maxSubmissions: number; graded: number };

// filter tasks older than 3 weeks
@Injectable()
export class TaskUC {
	constructor(private taskRepo: TaskRepo, private submissionRepo: SubmissionRepo) {}

	// TODO: move into seperate UC
	computeSubmissionMetadata = (taskSubmissions: Submission[], task: Task): ITaskSubmissionsMetaData => {
		const submittedUsers = new Set();
		const gradedUsers = new Set();

		const sortedSubmissions = [...taskSubmissions].sort((a: Submission, b: Submission) => {
			if (a.createdAt > b.createdAt) {
				return 1;
			}
			return -1;
		});

		sortedSubmissions.forEach((submission) => {
			if (
				!submittedUsers.has(submission.student.id) &&
				(submission.grade || submission.gradeComment || submission.gradeFileIds)
			) {
				gradedUsers.add(submission.student.id);
			}
			submittedUsers.add(submission.student.id);
		});
		// TODO: consider coursegroups
		const studentsInTasksCourse = task.course.students.length;

		return {
			submitted: submittedUsers.size,
			maxSubmissions: studentsInTasksCourse,
			graded: gradedUsers.size,
		};
	};

	// TODO by Students
	async findAllOpenForUser(userId: EntityId, pagination: IPagination): Promise<Counted<Task[]>> {
		// TODO authorization (user conditions -> permissions?)
		// TODO get permitted tasks...
		// TODO have BL from repo here

		const [tasks, total] = await this.taskRepo.findAllOpenByStudent(userId, pagination);
		return [tasks, total];
	}

	async findAllOpenByTeacher(userId: EntityId, pagination: IPagination): Promise<Counted<TaskResponse[]>> {
		const [tasks, total] = await this.taskRepo.findAllAssignedByTeacher(userId, pagination);
		const [submissions] = await this.submissionRepo.getSubmissionsByTasksList(tasks);

		const computedTasks = tasks.map((task) => {
			const taskSubmissions = submissions.filter((sub) => sub.task === task);
			return TaskMapper.mapToResponse(task, this.computeSubmissionMetadata(taskSubmissions, task));
		});
		return [computedTasks, total];
	}

	async findAllOpen(currentUser: ICurrentUser, pagination: IPagination): Promise<Counted<TaskResponse[]>> {
		// TODO: get permissions
		const { roles } = currentUser;
		const { userId } = currentUser;
		const permissions = [''] as string[];
		if (!permissions.includes('TASK_DASHBOARD_TEACHER_VIEW_V3') && !permissions.includes('TASK_DASHBOARD_VIEW_V3')) {
			throw new UnauthorizedException();
			// return [[], 0];
		}

		let response: Counted<TaskResponse[]>;
		if (permissions.includes('TASK_DASHBOARD_TEACHER_VIEW_V3')) {
			response = await this.findAllOpenByTeacher(userId, pagination);
		} else {
			const [tasks, total] = await this.findAllOpenForUser(userId, pagination);
			const computedTasks = tasks.map((task) => TaskMapper.mapToResponse(task));
			response = [computedTasks, total];
		}

		return response;
	}
}
