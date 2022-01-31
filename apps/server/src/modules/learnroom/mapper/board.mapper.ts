import { Injectable } from '@nestjs/common';
import { Course, Lesson, TaskWithStatusVo } from '@shared/domain';
import {
	BoardResponse,
	BoardElementResponse,
	BoardTaskResponse,
	BoardLessonResponse,
} from '../controller/dto/roomBoardResponse';
import { Board } from '../uc/rooms.uc';
import { BoardTaskStatusMapper } from './board-taskStatus.mapper';

@Injectable()
export class BoardMapper {
	mapToResponse(board: Board): BoardResponse {
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
				mappedTask.description =
					"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

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
