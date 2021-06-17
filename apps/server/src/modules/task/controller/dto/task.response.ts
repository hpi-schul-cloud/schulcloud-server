import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for returning a task document via api.
 */
export class TaskResponse {
	@ApiProperty()
	name: string;

	@ApiProperty()
	duedate?: Date;

	@ApiProperty()
	courseName?: string;

	@ApiProperty()
	displayColor?: string;

	@ApiProperty()
	id: string;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	@ApiProperty()
	status?: {
		submitted?: number;
		maxSubmissions?: number;
		graded?: number;
	}
}
