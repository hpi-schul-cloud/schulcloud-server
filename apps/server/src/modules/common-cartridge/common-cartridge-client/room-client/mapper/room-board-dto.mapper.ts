import { RoomBoardDto, BoardTaskDto, BoardLessonDto, BoardElementDto, BoardColumnBoardDto } from '../dto';
import { BoardElementDtoType } from '../enums/board-element.enum';
import {
	BoardColumnBoardResponse,
	BoardElementResponse,
	BoardLessonResponse,
	BoardTaskResponse,
	SingleColumnBoardResponse,
} from '../room-api-client';
import { BoardTaskStatusMapper } from './board-task-status-dto.mapper';
import { BoardColumnBoardLayoutMapper } from './board-column-board-layout-dto.mapper';

export class RoomBoardDtoMapper {
	public static mapResponseToRoomBoardDto(response: SingleColumnBoardResponse): RoomBoardDto {
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
			if (this.isBoardTaskResponse(element)) {
				elements.push(this.mapTask(element.content as BoardTaskResponse));
			}

			if (this.isBoardLessonResponse(element)) {
				elements.push(this.mapLesson(element.content as BoardLessonResponse));
			}

			if (this.isBoardColumnBoardResponse(element)) {
				elements.push(this.mapColumnBoard(element.content as BoardColumnBoardResponse));
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
			availableDate: task.availableDate ?? undefined,
			dueDate: task.dueDate ?? undefined,
			courseName: task.courseName ?? undefined,
			description: task.description ?? undefined,
			displayColor: task.displayColor ?? undefined,
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

	private static isBoardTaskResponse(element: BoardElementResponse): element is BoardElementResponse {
		return element.type === BoardElementDtoType.TASK;
	}

	private static isBoardLessonResponse(element: BoardElementResponse): element is BoardElementResponse {
		return element.type === BoardElementDtoType.LESSON;
	}

	private static isBoardColumnBoardResponse(element: BoardElementResponse): element is BoardElementResponse {
		return element.type === BoardElementDtoType.COLUMN_BOARD;
	}
}
