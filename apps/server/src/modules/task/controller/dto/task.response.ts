import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationResponse, DecodeHtmlEntities } from '@shared/controller';
import { TaskStatusResponse } from './task-status.response';

/**
 * DTO for returning a task document via api.
 */
export class TaskResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	name: string;

	@ApiPropertyOptional()
	availableDate?: Date;

	@ApiPropertyOptional()
	duedate?: Date;

	@ApiProperty()
	@DecodeHtmlEntities()
	courseName: string;

	@ApiPropertyOptional()
	@DecodeHtmlEntities()
	description?: string;

	@ApiPropertyOptional()
	displayColor?: string;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	@ApiProperty()
	status: TaskStatusResponse;
}

export class TaskListResponse extends PaginationResponse<TaskResponse[]> {
	constructor(data: TaskResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [TaskResponse] })
	data: TaskResponse[];
}
