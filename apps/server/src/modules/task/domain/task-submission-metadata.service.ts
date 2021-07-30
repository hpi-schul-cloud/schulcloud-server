import { Injectable } from '@nestjs/common';
import { ISubmissionStatus, Submission, Task } from '../entity';

@Injectable()
export class TaskSubmissionMetadataService {
	submissionStatusForTask = (submissions: Submission[], task: Task): ISubmissionStatus => {
		const submittedUsers = new Set();
		const gradedUsers = new Set();

		const sortedSubmissions = [...submissions].sort((a: Submission, b: Submission) => {
			if (a.createdAt < b.createdAt) {
				return 1;
			}
			return -1;
		});

		sortedSubmissions.forEach((submission) => {
			if (submission.task.id === task.id) {
				if (
					!submittedUsers.has(submission.student.id) &&
					(submission.grade || submission.gradeComment || submission.gradeFileIds.length)
				) {
					gradedUsers.add(submission.student.id);
				}
				submittedUsers.add(submission.student.id);
			}
		});
		// TODO: consider coursegroups
		const numberOfStudentsInTasksCourse = task.course.students.length;

		return {
			submitted: submittedUsers.size,
			maxSubmissions: numberOfStudentsInTasksCourse,
			graded: gradedUsers.size,
		};
	};
}
