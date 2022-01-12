import { Injectable } from '@nestjs/common';
import { BoardResponse } from '../controller/dto/roomBoardResponse';
import { Board } from '../uc/rooms.uc';

@Injectable()
export class BoardMapper {
	mapToResponse(board: Board): BoardResponse {
		return new BoardResponse({ content: [] });
	}
}
