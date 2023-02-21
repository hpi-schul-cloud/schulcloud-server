import { Injectable } from '@nestjs/common';
import { Course, TaskWithStatusVo } from '@shared/domain';
import {
	BoardElementResponse,
	BoardLessonResponse,
	BoardTaskResponse,
	SingleColumnBoardResponse,
} from '../controller/dto';
import { LessonMetaData, RoomBoardDTO, RoomBoardElementTypes } from '../types';
import { BoardTaskStatusMapper } from './board-taskStatus.mapper';

@Injectable()
export class RoomBoardResponseMapper {
	mapToResponse(board: RoomBoardDTO): SingleColumnBoardResponse {
		const elements = this.mapBoardElements(board);

		const mapped = new SingleColumnBoardResponse({
			roomId: board.roomId,
			title: board.title,
			displayColor: board.displayColor,
			elements,
		});

		return mapped;
	}

	private mapBoardElements = (board: RoomBoardDTO): BoardElementResponse[] => {
		const elements: BoardElementResponse[] = [];
		board.elements.forEach((element) => {
			if (element.type === RoomBoardElementTypes.TASK) {
				elements.push(this.mapTask(element.content as TaskWithStatusVo));
			} else if (element.type === RoomBoardElementTypes.LESSON) {
				elements.push(this.mapLesson(element.content as LessonMetaData));
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
		mappedTask.duedate = boardTask.dueDate;
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
}
