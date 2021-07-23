/* istanbul ignore file */
// TODO add tests to improve coverage

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

	// TODO: must move to other location, it is more a private methode but a part that must be tested seperatly
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

	// TODO: Combine student and teacher logic if it is possible in next iterations
	// TODO: Add for students in status -> student has finished, teacher has answered
	// TODO: After it, the permission check can removed
	async findAllOpenForStudent(userId: EntityId, pagination: IPagination): Promise<Counted<TaskResponse[]>> {
		// TODO authorization (user conditions -> permissions?)
		// TODO get permitted tasks...
		// TODO have BL from repo here

		const [submissionsOfStudent, submissionCount] = await this.submissionRepo.getAllSubmissionsByUser(userId);
		const tasksWithSubmissions = submissionsOfStudent.map((submission) => submission.task.id);

		const [tasks, total] = await this.taskRepo.findAllByStudent(userId, pagination, tasksWithSubmissions);
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
			response = await this.findAllOpenForStudent(id, pagination);
		} else {
			throw new UnauthorizedException();
		}

		return response;
	}
}
