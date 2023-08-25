import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { BoardTaskStatusResponse } from './board-task-status.response';

export class BoardTaskResponse {
	constructor({ id, name, createdAt, updatedAt, status }: BoardTaskResponse) {
		this.id = id;
		this.name = name;
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
	dueDate?: Date;

	@ApiPropertyOptional()
	@DecodeHtmlEntities()
	courseName?: string;

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
	status: BoardTaskStatusResponse;
}
