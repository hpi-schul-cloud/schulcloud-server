import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';

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
	};
}

export class TaskListResponse extends PaginationResponse<TaskResponse[]> {
	constructor(data: TaskResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [TaskResponse] })
	data: TaskResponse[];
}

