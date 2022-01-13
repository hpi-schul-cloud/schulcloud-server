import { ApiProperty } from '@nestjs/swagger';
import { TaskResponse } from '../../../task/controller/dto';

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
		description: 'Color of the Board',
	})
	content: TaskResponse; // TODO: define our own taskresponse
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
		description: 'Color of the Board',
	})
	elements: BoardElementResponse[];
}
