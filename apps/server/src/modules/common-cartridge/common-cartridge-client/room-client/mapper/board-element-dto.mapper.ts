import { BoardColumnBoardDto } from '../dto/board-column-board.dto';
import { BoardElementDto } from '../dto/board-element.dto';
import { BoardLessonDto } from '../dto/board-lesson.dto';
import { BoardTaskDto } from '../dto/board-task.dto';
import { RoomBoardDto } from '../dto/room-board.dto';
import { BoardElementDtoType } from '../enums/board-element.enum';
import {
	BoardColumnBoardResponse,
	BoardElementResponseContent,
	BoardLessonResponse,
	BoardTaskResponse,
	SingleColumnBoardResponse,
} from '../room-api-client';
import { BoardTaskStatusMapper } from './board-task-status-dto.mapper';
import { BoardColumnBoardLayoutMapper } from './board-column-board-layout-dto.mapper';

export class RoomBoardDtoMapper {
	public static mapResponseToRommBoardDto(response: SingleColumnBoardResponse): RoomBoardDto {
		const elements: BoardElementDto[] = this.mapBoardElements(response);

		const mapped: RoomBoardDto = new RoomBoardDto({
			roomId: response.roomId,
			title: response.title,
			displayColor: response.displayColor,
			elements,
			isArchived: response.isArchived,
			isSynchronized: response.isSynchronized,
		});

		return mapped;
	}

	private static mapBoardElements(response: SingleColumnBoardResponse): BoardElementDto[] {
		const elements: BoardElementDto[] = [];
		response.elements.forEach((element) => {
			if (this.isBoardTaskResponse(element.content)) {
				elements.push(this.mapTask(element.content));
			}

			if (this.isBoardLessonResponse(element.content)) {
				elements.push(this.mapLesson(element.content));
			}

			if (this.isBoardColumnBoardResponse(element.content)) {
				elements.push(this.mapColumnBoard(element.content));
			}
		});
		return elements;
	}

	private static mapTask(task: BoardTaskResponse): BoardElementDto {
		const mappedTask = new BoardTaskDto({
			id: task.id,
			name: task.name,
			createdAt: task.createdAt,
			updatedAt: task.updatedAt,
			status: BoardTaskStatusMapper.mapBoardTaskStatusToDto(task.status),
		});

		const boardElmentDto = new BoardElementDto({
			type: BoardElementDtoType.TASK,
			content: mappedTask,
		});

		return boardElmentDto;
	}

	private static mapLesson(lesson: BoardLessonResponse): BoardElementDto {
		const mappedLesson = new BoardLessonDto({
			id: lesson.id,
			name: lesson.name,
			hidden: lesson.hidden,
			createdAt: lesson.createdAt,
			updatedAt: lesson.updatedAt,
			numberOfPublishedTasks: lesson.numberOfPublishedTasks,
			numberOfDraftTasks: lesson.numberOfDraftTasks,
			numberOfPlannedTasks: lesson.numberOfPlannedTasks,
		});

		const boardElmentDto = new BoardElementDto({
			type: BoardElementDtoType.LESSON,
			content: mappedLesson,
		});

		return boardElmentDto;
	}

	private static mapColumnBoard(columnBoard: BoardColumnBoardResponse): BoardElementDto {
		const mappedColumnBoard = new BoardColumnBoardDto({
			id: columnBoard.id,
			columnBoardId: columnBoard.columnBoardId,
			title: columnBoard.title,
			published: columnBoard.published,
			createdAt: columnBoard.createdAt,
			updatedAt: columnBoard.updatedAt,
			layout: BoardColumnBoardLayoutMapper.mapColumnBoardLayoutToDto(columnBoard.layout),
		});

		const boardElmentDto = new BoardElementDto({
			type: BoardElementDtoType.COLUMN_BOARD,
			content: mappedColumnBoard,
		});

		return boardElmentDto;
	}

	private static isBoardTaskResponse(content: BoardElementResponseContent): content is BoardTaskResponse {
		return (content as BoardTaskResponse).status !== undefined;
	}

	private static isBoardLessonResponse(content: BoardElementResponseContent): content is BoardLessonResponse {
		return (content as BoardLessonResponse).courseName !== undefined;
	}

	private static isBoardColumnBoardResponse(content: BoardElementResponseContent): content is BoardColumnBoardResponse {
		return (content as BoardColumnBoardResponse).columnBoardId !== undefined;
	}
}
