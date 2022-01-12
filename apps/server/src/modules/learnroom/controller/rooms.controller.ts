import { Controller, Get, Param } from '@nestjs/common';
import { ParseObjectIdPipe } from '@shared/controller';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
import { RoomsUc } from '../uc/rooms.uc';
import { BoardMapper } from '../mapper/board.mapper';
import { BoardResponse } from './dto/roomBoardResponse';

@ApiTags('Rooms')
@Authenticate('jwt')
@Controller('rooms')
export class RoomsController {
	constructor(private readonly roomsUc: RoomsUc, private readonly mapper: BoardMapper) {}

	@Get(':id/content')
	async getRoomBoard(
		@Param('id', ParseObjectIdPipe) roomId: string,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<BoardResponse> {
		const board = await this.roomsUc.getBoard(roomId, currentUser.userId);
		const mapped = this.mapper.mapToResponse(board);
		return mapped;
	}
}
