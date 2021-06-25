import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId, IPagination } from '@shared/domain';
import { Counted } from '@shared/domain/types';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { TaskRepo } from '../repo/task.repo';
import { Task, Submission, ISubmissionStatus } from '../entity';
import { SubmissionRepo } from '../repo/submission.repo';
import { TaskMapper } from '../mapper/task.mapper';
import { TaskResponse } from '../controller/dto';

// TODO: add time filter filter in uc
@Injectable()
export class TaskUC {
	permissions = {
		teacherDashboard: 'TASK_DASHBOARD_TEACHER_VIEW_V3',
		studentDashboard: 'TASK_DASHBOARD_VIEW_V3',
	};

	constructor(private taskRepo: TaskRepo, private submissionRepo: SubmissionRepo) {}

	// TODO: move into seperate UC
	computeSubmissionMetadata = (taskSubmissions: Submission[], task: Task): ISubmissionStatus => {
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
	async findAllOpenForUser(userId: EntityId, pagination: IPagination): Promise<Counted<TaskResponse[]>> {
		// TODO authorization (user conditions -> permissions?)
		// TODO get permitted tasks...
		// TODO have BL from repo here

		const [tasks, total] = await this.taskRepo.findAllOpenByStudent(userId, pagination);
		const computedTasks = tasks.map((task) => TaskMapper.mapToResponse(task));
		return [computedTasks, total];
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
		const {
			user: { id, permissions },
		} = currentUser;

		let response: Counted<TaskResponse[]>;
		if (permissions.includes(this.permissions.teacherDashboard)) {
			response = await this.findAllOpenByTeacher(id, pagination);
		} else if (permissions.includes(this.permissions.studentDashboard)) {
			response = await this.findAllOpenForUser(id, pagination);
		} else {
			throw new UnauthorizedException();
		}

		return response;
	}
}
