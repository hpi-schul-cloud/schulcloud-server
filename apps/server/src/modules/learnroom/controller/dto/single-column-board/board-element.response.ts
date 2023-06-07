import { ApiProperty } from '@nestjs/swagger';
import { RoomBoardElementTypes } from '@src/modules/learnroom/types';
import { BoardColumnBoardResponse } from './board-column-board.response';
import { BoardLessonResponse } from './board-lesson.response';
import { BoardTaskResponse } from './board-task.response';

export class BoardElementResponse {
	constructor({ type, content }: BoardElementResponse) {
		this.type = type;
		this.content = content;
	}

	@ApiProperty({
		description: 'the type of the element in the content. For possible types, please refer to the enum',
		enum: RoomBoardElementTypes,
	})
	type: RoomBoardElementTypes;

	@ApiProperty({
		description: 'Content of the Board, either: a task or a lesson specific for the board',
	})
	content: BoardTaskResponse | BoardLessonResponse | BoardColumnBoardResponse;
}
