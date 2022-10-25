import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities, PaginationResponse } from '@shared/controller';
import { TaskStatusResponse } from './task-status.response';

/**
 * DTO for returning a task document via api.
 */
export class TaskResponse {
	constructor({ id, name, courseName, courseId, createdAt, updatedAt, status }: TaskResponse) {
		this.id = id;
		this.name = name;
		this.courseName = courseName;
		this.courseId = courseId;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.status = status;
	}

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
	courseName: string = '' as string;

	@ApiPropertyOptional()
	lessonName?: string;

	@ApiProperty()
	courseId: string = '' as string;

	@ApiPropertyOptional()
	@DecodeHtmlEntities()
	description?: string; // TODO: change this, since this is NOT the tasks description, but the name of its lesson

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
