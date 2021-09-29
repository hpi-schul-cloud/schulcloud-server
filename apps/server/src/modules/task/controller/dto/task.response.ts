import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for returning a task document via api.
 */
export class TaskResponse {
	@ApiProperty()
	name: string;

	@ApiProperty()
	duedate?: Date;

	@ApiPropertyOptional()
	courseName?: string;

	@ApiPropertyOptional()
	displayColor?: string;

	@ApiProperty()
	id: string;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	@ApiProperty()
	status: {
		submitted?: number;
		maxSubmissions?: number;
		graded?: number;
		isDraft: boolean;
	};
}
