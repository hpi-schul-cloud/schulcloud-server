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

// _THIS FILE AND LOGIC CAN IMPROVED A LOT BY RESORTING_
// find better solution over inline strategie in TaskPreparations
// it is all the time a combination of compute Task.status and compute maxSubmission values
// create a additional class with interface for it
// also status a possible key field in task that we can use task as return type with filled or empty status
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

	addParentToTasks(): void {
		this.tasks.forEach((task) => {
			const parentId = task.getParentId();
			const parent = this.parentsCollection.getById(parentId);
			task.setParent(parent);
		});
	}

	private prepareStatus(submissions: Submission[], fnName: MaxSubmissionsOperations): TaskWithSubmissionStatus[] {
		const metadata = new TaskSubmissionMetadata(submissions);
		const computedTasks = this.tasks.map((task) => metadata.addStatusToTask(task, this[fnName](task.getParentId())));
		return computedTasks;
	}

	// teacher
	// TODO: is must also work with coursegroups
	computeStatusForTeachers(submissionsOfTeacher: Submission[]): TaskWithSubmissionStatus[] {
		const computedTask = this.prepareStatus(submissionsOfTeacher, MaxSubmissionsOperations.teacher);
		return computedTask;
	}

	private getMaxSubmissionsForTeachersByCourseId(parentId: EntityId): number {
		const parent = this.parentsCollection.getById(parentId);
		const studentNumber = parent.getStudentsNumber();
		return studentNumber;
	}

	// students
	computeStatusForStudents(submissionsOfStudent: Submission[]): TaskWithSubmissionStatus[] {
		const computedTask = this.prepareStatus(submissionsOfStudent, MaxSubmissionsOperations.student);
		return computedTask;
	}

	private getMaxSubmissionsForStudentsByCourseId(): number {
		return 1;
	}
}
