import { Injectable } from '@nestjs/common';
import { Course, Lesson, TaskWithStatusVo } from '@shared/domain';
import {
	BoardResponse,
	BoardElementResponse,
	BoardTaskResponse,
	BoardLessonResponse,
	BoardLockedTaskResponse,
} from '../controller/dto/roomBoardResponse';
import { RoomBoardDTO, LockedTaskDTO, RoomBoardElementTypes } from '../types';
import { BoardTaskStatusMapper } from './board-taskStatus.mapper';

@Injectable()
export class RoomBoardResponseMapper {
	mapToResponse(board: RoomBoardDTO): BoardResponse {
		const elements: BoardElementResponse[] = [];
		board.elements.forEach((element) => {
			if (element.type === RoomBoardElementTypes.TASK) {
				const { task: boardTask, status } = element.content as TaskWithStatusVo;
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
				elements.push(boardElementResponse);
			} else if (element.type === RoomBoardElementTypes.LESSON) {
				const boardLesson = element.content as Lesson;

				const mappedLesson = new BoardLessonResponse({
					id: boardLesson.id,
					name: boardLesson.name,
					hidden: boardLesson.hidden,
					createdAt: boardLesson.createdAt,
					updatedAt: boardLesson.updatedAt,
				});

				const lessonCourse = boardLesson.course;
				mappedLesson.courseName = lessonCourse.name;

				const boardElementResponse = new BoardElementResponse({
					type: RoomBoardElementTypes.LESSON,
					content: mappedLesson,
				});
				elements.push(boardElementResponse);
			} else if (element.type === RoomBoardElementTypes.LOCKEDTASK) {
				const data = element.content as LockedTaskDTO;
				const mappedLockedTask = new BoardLockedTaskResponse({
					id: data.id,
					name: data.name,
				});
				const boardElementResponse = new BoardElementResponse({
					type: RoomBoardElementTypes.LOCKEDTASK,
					content: mappedLockedTask,
				});
				elements.push(boardElementResponse);
			}
		});
		const mapped = new BoardResponse({
			roomId: board.roomId,
			title: board.title,
			displayColor: board.displayColor,
			elements,
		});
		return mapped;
	}
}
