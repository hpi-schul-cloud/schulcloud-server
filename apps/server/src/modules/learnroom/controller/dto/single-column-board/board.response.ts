import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { UserInfoResponse } from '@src/modules/news/controller/dto/user-info.response';
import { BoardElementResponse } from './board-element.response';

// TODO: this and DashboardResponse should be combined
export class SingleColumnBoardResponse {
	constructor({ roomId, title, displayColor, elements, isArchived, usersList }: SingleColumnBoardResponse) {
		this.roomId = roomId;
		this.title = title;
		this.displayColor = displayColor;
		this.elements = elements;
		this.isArchived = isArchived;
		this.usersList = usersList;
	}

	@ApiProperty({
		description: 'The id of the room this board belongs to',
		pattern: '[a-f0-9]{24}',
	})
	roomId: string;

	@DecodeHtmlEntities()
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

	@ApiProperty({
		description: 'Boolean if the room this board belongs to is archived',
	})
	isArchived: boolean;

	@ApiProperty({
		description: 'Reference to the list of students assigned to the room.',
	})
	usersList: UserInfoResponse[];
}
