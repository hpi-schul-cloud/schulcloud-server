import { Injectable } from '@nestjs/common';
import { EntityId, IPagination } from '@shared/domain';
import { Counted } from '@shared/domain/types';
import { TaskRepo } from '../repo/task.repo';
import { Task } from '../entity';
import { SubmissionRepo } from '../repo/submission.repo';

// TODO move to different file
export type TaskSubmissionsMetaData = { submitted: number; maxSubmissions: number; graded: number };

// filter tasks older than 3 weeks
@Injectable()
export class TaskUC {
	constructor(private taskRepo: TaskRepo, private submissionRepo: SubmissionRepo) {}

	async findAllOpenForUser(userId: EntityId, pagination: IPagination): Promise<Counted<Task[]>> {
		// TODO authorization (user conditions -> permissions?)
		// TODO get permitted tasks...
		// TODO have BL from repo here

		const [tasks, total] = await this.taskRepo.findAllOpenByStudent(userId, pagination);
		return [tasks, total];
	}

	// TODO move somewhere more private
	async getTaskSubmissionMetadata(task: Task): Promise<TaskSubmissionsMetaData> {
		const [taskSubmissions, count] = await this.submissionRepo.getSubmissionsByTask(task);
		const submittedUsers = new Set();
		const gradedUsers = new Set();

		taskSubmissions.forEach((submission) => {
			submittedUsers.add(submission.student.id);
			if (submission.grade || submission.gradeComment || submission.gradeFileIds)
				gradedUsers.add(submission.student.id);
		});

		return Promise.resolve({
			submitted: submittedUsers.size,
			maxSubmissions: -1,
			graded: gradedUsers.size,
		});
	}
}
