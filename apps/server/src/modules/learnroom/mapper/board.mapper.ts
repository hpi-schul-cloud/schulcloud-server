import { Injectable } from '@nestjs/common';
import { BoardResponse, BoardElementResponse, BoardTaskResponse } from '../controller/dto/roomBoardResponse';
import { Board } from '../uc/rooms.uc';

@Injectable()
export class BoardMapper {
	mapToResponse(board: Board): BoardResponse {
		const elements = board.elements.map((element) => {
			const boardTask = element.content;
			const boardTaskDesc = boardTask.getDescriptions();

			const mappedTask = new BoardTaskResponse({
				id: boardTask.id,
				name: boardTask.name,
				createdAt: boardTask.createdAt,
				updatedAt: boardTask.updatedAt,
			});

			mappedTask.courseName = boardTask.course?.name;
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
