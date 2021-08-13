import { Injectable } from '@nestjs/common';
import { ISubmissionStatus, Submission, Task } from '../entity';

/**
 * Sounds more like a TaskMetadata class that can instances over new TaskMetadata(maxSubmissions, submissions);
 * to iterate stuff for Task -> TaskMetadata.generateStatus(task): ISubmissionStatus;
 * */
@Injectable()
export class TaskSubmissionMetadataService {
	private isGraded(submission: Submission): boolean {
		const isGraded =
			(typeof submission.grade === 'number' && submission.grade >= 0) ||
			(typeof submission.gradeComment === 'string' && submission.gradeComment.length > 0) ||
			(submission.gradeFiles !== undefined && submission.gradeFiles.length > 0);
		return isGraded;
	}

	private sort(submissions: Submission[]): Submission[] {
		const sortedSubmissions = [...submissions].sort((a: Submission, b: Submission) => {
			if (a.createdAt < b.createdAt) {
				return 1;
			}
			return -1;
		});
		return sortedSubmissions;
	}

	submissionStatusForTask = (submissions: Submission[], task: Task, maxSubmissions: number): ISubmissionStatus => {
		const submittedUsers = new Set();
		const gradedUsers = new Set();

		// important to only count the newest graded
		const sortedSubmissions = this.sort(submissions);

		sortedSubmissions.forEach((submission) => {
			if (submission.task.id === task.id) {
				if (!submittedUsers.has(submission.student.id) && this.isGraded(submission)) {
					gradedUsers.add(submission.student.id);
				}
				submittedUsers.add(submission.student.id);
			}
		});

		return {
			submitted: submittedUsers.size,
			maxSubmissions,
			graded: gradedUsers.size,
		};
	};
}
