import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationResponse, DecodeHtmlEntities } from '@shared/controller';

/**
 * DTO for returning a task document via api.
 */
export class TaskResponse {
	constructor({ name, id, createdAt, updatedAt, status }: TaskResponse) {
		this.name = name;
		this.id = id;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.status = status;
	}

	@ApiProperty()
	@DecodeHtmlEntities()
	name: string;

	@ApiProperty() // TODO use @ApiPropertyOptional() ?
	availableDate?: Date;

	@ApiProperty() // TODO use @ApiPropertyOptional() ?
	duedate?: Date;

	@ApiPropertyOptional()
	@DecodeHtmlEntities()
	courseName?: string;

	@ApiPropertyOptional()
	@DecodeHtmlEntities()
	description?: string;

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
		isSubstitutionTeacher: boolean;
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
