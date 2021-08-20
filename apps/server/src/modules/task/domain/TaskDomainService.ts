import { Task, Submission, ITaskParent } from '../entity';

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

	constructor(tasks: Task[], parents: ITaskParent[]) {
		this.tasks = this.addParentToTasks(tasks, parents);
	}

	private addParentToTasks(tasks: Task[], parents: ITaskParent[]): Task[] {
		tasks.forEach((task) => {
			const parentId = task.getParentId();
			const parent = parents.find((p) => p.id === parentId);
			task.setParent(parent);
		});
		return tasks;
	}

	private prepareStatus(submissions: Submission[], fnName: MaxSubmissionsOperations): TaskWithSubmissionStatus[] {
		const domain = new StatusDomainService(submissions);
		const computedTasks = this.tasks.map((task) => domain.addStatusToTask(task, this[fnName](task)));
		return computedTasks;
	}

	// teacher
	// TODO: is must also work with coursegroups
	computeStatusForTeachers(submissionsOfTeacher: Submission[]): TaskWithSubmissionStatus[] {
		const computedTask = this.prepareStatus(submissionsOfTeacher, MaxSubmissionsOperations.teacher);
		return computedTask;
	}

	private getMaxSubmissionsForTeachersByCourseId(task: Task): number {
		const parent = task.getParent();
		const studentNumber = parent !== undefined ? parent.getStudentsNumber() : 0;
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
