import { EntityId } from '@shared/domain';

import { Task, Submission, ITaskParent } from '../entity';
import { EntityCollection } from '../utils';

import { TaskSubmissionMetadata } from './TaskSubmissionMetadata';

// That is bad with this two type i think...
type ISubmissionStatus = {
	submitted: number;
	maxSubmissions: number;
	graded: number;
};

export type TaskWithSubmissionStatus = {
	task: Task;
	status: ISubmissionStatus;
};

enum MaxSubmissionsOperations {
	teacher = 'getMaxSubmissionsForTeachersByCourseId',
	student = 'getMaxSubmissionsForStudentsByCourseId',
}

export class TaskPreparations {
	tasks: Task[];

	parentsCollection: EntityCollection<ITaskParent>;

	constructor(parentsCollection: EntityCollection<ITaskParent>, tasks: Task[]) {
		this.parentsCollection = parentsCollection;
		this.tasks = tasks;
	}

	private prepareStatus(submissions: Submission[], fnName: MaxSubmissionsOperations): TaskWithSubmissionStatus[] {
		const metadata = new TaskSubmissionMetadata(submissions);
		const computedTasks = this.tasks.map((task) => metadata.addStatusToTask(task, this[fnName](task.getParentId())));
		return computedTasks;
	}

	computeStatusForTeachers(submissionsOfTeacher: Submission[]): TaskWithSubmissionStatus[] {
		const computedTask = this.prepareStatus(submissionsOfTeacher, MaxSubmissionsOperations.teacher);
		return computedTask;
	}

	computeStatusForStudents(submissionsOfStudent: Submission[]): TaskWithSubmissionStatus[] {
		const computedTask = this.prepareStatus(submissionsOfStudent, MaxSubmissionsOperations.student);
		return computedTask;
	}

	addParentToTasks(): void {
		this.tasks.forEach((task) => {
			const parentId = task.getParentId();
			const parent = this.parentsCollection.getById(parentId);
			task.setParent(parent);
		});
	}

	getMaxSubmissionsForTeachersByCourseId(parentId: EntityId): number {
		const parent = this.parentsCollection.getById(parentId);
		const studentNumber = parent.getStudentsNumber();
		return studentNumber;
	}

	getMaxSubmissionsForStudentsByCourseId(): number {
		return 1;
	}
}
