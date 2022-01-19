import { Injectable } from '@nestjs/common';
import { Course } from '@shared/domain';
import { BoardResponse, BoardElementResponse, BoardTaskResponse } from '../controller/dto/roomBoardResponse';
import { Board } from '../uc/rooms.uc';
import { BoardTaskStatusMapper } from './board-taskStatus.mapper';

@Injectable()
export class BoardMapper {
	mapToResponse(board: Board): BoardResponse {
		const elements = board.elements.map((element) => {
			const { task: boardTask, status } = element.content;
			const boardTaskDesc = boardTask.getDescriptions();
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
			mappedTask.description = boardTaskDesc.description;

			const boardElementResponse = new BoardElementResponse({ type: 'task', content: mappedTask });
			return boardElementResponse;
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
