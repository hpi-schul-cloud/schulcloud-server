import { EntityId } from '@shared/domain';

import { Task, Submission, ITaskParent } from '../entity';
import { EntityArray } from '../utils';

import { StatusDomainService } from './StatusDomainService';

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

export class TaskDomainService {
	tasks: Task[];

	parents: EntityArray<ITaskParent>;

	constructor(parentsCollection: EntityArray<ITaskParent>, tasks: Task[]) {
		this.parents = parentsCollection;
		this.tasks = tasks;
	}

	addParentToTasks(): void {
		this.tasks.forEach((task) => {
			const parentId = task.getParentId();
			const parent = this.parents.getById(parentId);
			task.setParent(parent);
		});
	}

	private prepareStatus(submissions: Submission[], fnName: MaxSubmissionsOperations): TaskWithSubmissionStatus[] {
		const domain = new StatusDomainService(submissions);
		const computedTasks = this.tasks.map((task) => domain.addStatusToTask(task, this[fnName](task.getParentId())));
		return computedTasks;
	}

	// teacher
	// TODO: is must also work with coursegroups
	computeStatusForTeachers(submissionsOfTeacher: Submission[]): TaskWithSubmissionStatus[] {
		const computedTask = this.prepareStatus(submissionsOfTeacher, MaxSubmissionsOperations.teacher);
		return computedTask;
	}

	private getMaxSubmissionsForTeachersByCourseId(parentId: EntityId): number {
		const parent = this.parents.getById(parentId);
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
