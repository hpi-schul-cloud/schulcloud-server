import { Injectable } from '@nestjs/common';
import { Task } from '../../../shared/domain';
import { TaskMapper } from '../../task/mapper/task.mapper';
import { BoardResponse } from '../controller/dto/roomBoardResponse';
import { Board, BoardElement } from '../uc/rooms.uc';

@Injectable()
export class BoardMapper {
	mapToResponse(board: Board): BoardResponse {
		const elements = [];
		const mapped = new BoardResponse({
			roomId: board.roomId,
			title: board.title,
			displayColor: board.displayColor,
			elements,
		});
		return mapped;
	}
}
