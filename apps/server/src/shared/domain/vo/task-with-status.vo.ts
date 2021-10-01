import { Task } from '../entity/task.entity';

interface ITaskStatus {
	submitted: number;
	maxSubmissions: number;
	graded: number;
}

export class TaskWithStatusVo {
	task!: Task;

	status!: ITaskStatus;

	constructor(task: Task, status: ITaskStatus) {
		this.task = task;
		this.status = status;
	}
}
