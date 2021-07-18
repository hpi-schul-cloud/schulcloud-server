import { FilteredCourseGroups } from '../../user';
import { Submission, ISubmissionStatus, Task } from '../entity';
import { TaskMapper } from '../mapper/task.mapper';
import { TaskResponse } from '../controller/dto';

export class TaskHelper {
	static computeSubmissionStatus = (taskSubmissions: Submission[], maxSubmissions = 0): ISubmissionStatus => {
		const submittedUsers = new Set();
		const gradedUsers = new Set();

		// TODO: should only get the newest submission
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

		return {
			submitted: submittedUsers.size,
			maxSubmissions,
			graded: gradedUsers.size,
		};
	};

	static calculateDateFilterForOpenTask(): Date {
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
		return oneWeekAgo;
	}

	static computedTasksBySubmissions(
		tasks: Task[],
		submissions: Submission[],
		filteredCourseGroups: FilteredCourseGroups
	): TaskResponse[] {
		// coursegroups <=> max students for maxSubmissions -> move to additional function
		const maxSubmissions: number = filteredCourseGroups['course-students'].getNumberOfGroups();
		const computedTasks = tasks.map((task) => {
			const taskSubmissions = submissions.filter((sub) => sub.task === task);
			return TaskMapper.mapToResponse(task, this.computeSubmissionStatus(taskSubmissions, maxSubmissions));
		});
		return computedTasks;
	}
}
