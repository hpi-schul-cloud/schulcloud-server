import { Expose } from 'class-transformer';

/**
 * DTO for returning a task document via api.
 */
export class TaskResponse {
	@Expose()
	name: string;

	@Expose()
	duedate?: Date;

	@Expose()
	courseName?: string;

	@Expose()
	displayColor?: string;

	@Expose()
	id: string;

	@Expose()
	createdAt: Date;

	@Expose()
	updatedAt: Date;

	// status: string;
}
