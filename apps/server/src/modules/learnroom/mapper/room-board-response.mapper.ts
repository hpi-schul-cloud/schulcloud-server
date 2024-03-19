import { Injectable } from '@nestjs/common';
import { Course, TaskWithStatusVo } from '@shared/domain/entity';
import {
	BoardElementResponse,
	BoardLessonResponse,
	BoardTaskResponse,
	SingleColumnBoardResponse,
} from '../controller/dto';
import { BoardColumnBoardResponse } from '../controller/dto/single-column-board/board-column-board.response';
import { ColumnBoardMetaData, LessonMetaData, RoomBoardDTO, RoomBoardElementTypes } from '../types';
import { BoardTaskStatusMapper } from './board-taskStatus.mapper';

@Injectable()
export class RoomBoardResponseMapper {
	mapToResponse(board: RoomBoardDTO): SingleColumnBoardResponse {
		const elements: BoardElementResponse[] = this.mapBoardElements(board);

		const mapped: SingleColumnBoardResponse = new SingleColumnBoardResponse({
			roomId: board.roomId,
			title: board.title,
			displayColor: board.displayColor,
			elements,
			isArchived: board.isArchived,
			isSynchronized: board.isSynchronized,
		});

		return mapped;
	}

	private mapBoardElements = (board: RoomBoardDTO): BoardElementResponse[] => {
		const elements: BoardElementResponse[] = [];
		board.elements.forEach((element) => {
			if (element.type === RoomBoardElementTypes.TASK) {
				elements.push(this.mapTask(element.content as TaskWithStatusVo));
			}

			if (element.type === RoomBoardElementTypes.LESSON) {
				elements.push(this.mapLesson(element.content as LessonMetaData));
			}

			if (element.type === RoomBoardElementTypes.COLUMN_BOARD) {
				elements.push(this.mapColumnBoard(element.content as ColumnBoardMetaData));
			}
		});
		return elements;
	};

	private mapTask = (taskWithStatus: TaskWithStatusVo): BoardElementResponse => {
		const { task: boardTask, status } = taskWithStatus;
		const boardTaskDesc = boardTask.getParentData();
		const boardTaskStatus = BoardTaskStatusMapper.mapToResponse(status);

		const mappedTask = new BoardTaskResponse({
			id: boardTask.id,
			name: boardTask.name,
			createdAt: boardTask.createdAt,
			updatedAt: boardTask.updatedAt,
			status: boardTaskStatus,
		});

		const taskCourse = boardTask.course as Course;
		mappedTask.courseName = taskCourse.name;
		mappedTask.availableDate = boardTask.availableDate;
		mappedTask.dueDate = boardTask.dueDate;
		mappedTask.displayColor = boardTaskDesc.color;
		mappedTask.description = boardTask.description;
		const boardElementResponse = new BoardElementResponse({
			type: RoomBoardElementTypes.TASK,
			content: mappedTask,
		});
		return boardElementResponse;
	};

	private mapLesson = (lesson: LessonMetaData): BoardElementResponse => {
		const mappedLesson = new BoardLessonResponse({
			id: lesson.id,
			name: lesson.name,
			hidden: lesson.hidden,
			createdAt: lesson.createdAt,
			updatedAt: lesson.updatedAt,
			numberOfPublishedTasks: lesson.numberOfPublishedTasks,
			numberOfDraftTasks: lesson.numberOfDraftTasks,
			numberOfPlannedTasks: lesson.numberOfPlannedTasks,
			courseName: lesson.courseName,
		});

		const boardElementResponse = new BoardElementResponse({
			type: RoomBoardElementTypes.LESSON,
			content: mappedLesson,
		});
		return boardElementResponse;
	};

	private mapColumnBoard = (columnBoardInfo: ColumnBoardMetaData): BoardElementResponse => {
		const mappedColumnBoard = new BoardColumnBoardResponse({
			id: columnBoardInfo.id,
			columnBoardId: columnBoardInfo.columnBoardId,
			title: columnBoardInfo.title,
			published: columnBoardInfo.published,
			createdAt: columnBoardInfo.createdAt,
			updatedAt: columnBoardInfo.updatedAt,
		});

		const boardElementResponse = new BoardElementResponse({
			type: RoomBoardElementTypes.COLUMN_BOARD,
			content: mappedColumnBoard,
		});
		return boardElementResponse;
	};
}
