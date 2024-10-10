import { BoardElementDtoType } from '../enums/board-element.enum';
import { BoardColumnBoardDto } from './board-column-board.dto';
import { BoardLessonDto } from './board-lesson.dto';
import { BoardTaskDto } from './board-task.dto';

export class BoardElementDto {
	type: BoardElementDtoType;

	content: BoardTaskDto | BoardLessonDto | BoardColumnBoardDto;

	constructor(props: BoardElementDto) {
		this.type = props.type;
		this.content = props.content;
	}
}
