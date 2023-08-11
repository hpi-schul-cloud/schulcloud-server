import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities, PaginationResponse } from '@shared/controller';
import { RichText } from '@shared/domain';
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
		this.lessonHidden = false;
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
	dueDate?: Date;

	@ApiProperty()
	@DecodeHtmlEntities()
	courseName: string = '' as string;

	@ApiPropertyOptional()
	lessonName?: string;

	@ApiProperty()
	courseId: string = '' as string;

	@ApiPropertyOptional({
		description: 'Task description object, with props content: string and type: input format types',
		type: RichText,
	})
	@DecodeHtmlEntities()
	description?: RichText;

	@ApiProperty()
	lessonHidden: boolean;

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
