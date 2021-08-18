import { Submission, Task } from '../entity';

export class StatusDomainService {
	submissions: Submission[];

	constructor(submissions: Submission[]) {
		this.submissions = submissions;
	}

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

	// Bad name it generate or map a new type
	addStatusToTask(
		task: Task,
		maxSubmissions: number
	): { task: Task; status: { submitted: number; maxSubmissions: number; graded: number } } {
		const submittedUsers = new Set();
		const gradedUsers = new Set();

		// important to only count the newest graded
		const sortedSubmissions = this.sort(this.submissions);

		sortedSubmissions.forEach((submission) => {
			if (submission.task.id === task.id) {
				if (!submittedUsers.has(submission.student.id) && this.isGraded(submission)) {
					gradedUsers.add(submission.student.id);
				}
				submittedUsers.add(submission.student.id);
			}
		});

		return {
			task,
			status: {
				submitted: submittedUsers.size,
				maxSubmissions,
				graded: gradedUsers.size,
			},
		};
	}
}
