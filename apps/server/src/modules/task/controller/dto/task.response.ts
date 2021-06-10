import { Expose } from 'class-transformer';

/**
 * DTO for returning a task document via api.
 */
export class TaskResponse {
	constructor(partial: Partial<TaskResponse>) {
		Object.assign(this, partial);
	}

	@Expose()
	name: string;

	@Expose()
	duedate: Date;

	@Expose()
	courseName: string;

	@Expose()
	displayColor: string;

	@Expose()
	id: string;
	// status: string;
}
