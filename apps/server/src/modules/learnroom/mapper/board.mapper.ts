import { Injectable } from '@nestjs/common';
import { Course, Lesson, TaskWithStatusVo } from '@shared/domain';
import {
	BoardResponse,
	BoardElementResponse,
	BoardTaskResponse,
	BoardLessonResponse,
} from '../controller/dto/roomBoardResponse';
import { IBoard } from '../uc/rooms.uc';
import { BoardTaskStatusMapper } from './board-taskStatus.mapper';

@Injectable()
export class BoardMapper {
	mapToResponse(board: IBoard): BoardResponse {
		const elements: BoardElementResponse[] = [];
		board.elements.forEach((element) => {
			if (element.type === 'task') {
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
				const boardElementResponse = new BoardElementResponse({ type: 'task', content: mappedTask });
				elements.push(boardElementResponse);
			} else if (element.type === 'lesson') {
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

				const boardElementResponse = new BoardElementResponse({ type: 'lesson', content: mappedLesson });
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
