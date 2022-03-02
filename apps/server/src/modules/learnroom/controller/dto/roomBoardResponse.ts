import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { BoardTaskStatusResponse } from './roomBoardResponse-taskStatus';

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
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	@ApiProperty()
	status: BoardTaskStatusResponse;
}

export class BoardTaskMetadataResponse {
	constructor({ id, name, allowed }: BoardTaskMetadataResponse) {
		this.id = id;
		this.name = name;
		this.allowed = allowed;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	name: string;

	@ApiProperty()
	allowed: boolean;
}

export class BoardLessonResponse {
	constructor({ id, name, hidden, createdAt, updatedAt }: BoardLessonResponse) {
		this.id = id;
		this.name = name;
		this.hidden = hidden;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}

	@ApiProperty()
	id: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	name: string;

	@ApiPropertyOptional()
	@DecodeHtmlEntities()
	courseName?: string;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	@ApiProperty()
	hidden: boolean;
}

export class BoardElementResponse {
	constructor({ type, content }: BoardElementResponse) {
		this.type = type;
		this.content = content;
	}

	@ApiProperty({
		description: 'ElementType. Can be any of: "task", "lesson".',
	})
	type: string;

	@ApiProperty({
		description: 'Content of the Board, either: a task or a lesson specific for the board',
	})
	content: BoardTaskResponse | BoardTaskMetadataResponse | BoardLessonResponse;
}

// TODO: this and DashboardResponse should be combined
export class BoardResponse {
	constructor({ roomId, title, displayColor, elements }: BoardResponse) {
		this.roomId = roomId;
		this.title = title;
		this.displayColor = displayColor;
		this.elements = elements;
	}

	@ApiProperty({
		description: 'The id of the room this board belongs to',
		pattern: '[a-f0-9]{24}',
	})
	roomId: string;

	@ApiProperty({
		description: 'Title of the Board',
	})
	title: string;

	@ApiProperty({
		description: 'Color of the Board',
	})
	displayColor: string;

	@ApiProperty({
		type: [BoardElementResponse],
		description: 'Array of board specific tasks or lessons with matching type property',
	})
	elements: BoardElementResponse[];
}
