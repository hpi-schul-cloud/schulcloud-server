import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ParseObjectIdPipe } from '@shared/controller';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
import { RoomsUc } from '../uc/rooms.uc';
import { RoomBoardResponseMapper } from '../mapper/room-board-response.mapper';
import { BoardResponse, PatchVisibilityParams, PatchOrderParams } from './dto';

@ApiTags('Rooms')
@Authenticate('jwt')
@Controller('rooms')
export class RoomsController {
	constructor(private readonly roomsUc: RoomsUc, private readonly mapper: RoomBoardResponseMapper) {}

	@Get(':roomid/board')
	async getRoomBoard(
		@Param('roomid', ParseObjectIdPipe) roomId: string,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<BoardResponse> {
		const board = await this.roomsUc.getBoard(roomId, currentUser.userId);
		const mapped = this.mapper.mapToResponse(board);
		return mapped;
	}

	@Patch(':roomid/elements/:elementid/visibility')
	async patchElementVisibility(
		@Param('roomid', ParseObjectIdPipe) roomId: string,
		@Param('elementid', ParseObjectIdPipe) elementId: string,
		@Body() params: PatchVisibilityParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.roomsUc.updateVisibilityOfBoardElement(roomId, elementId, currentUser.userId, params.visibility);
	}

	@Patch(':roomid/board/order')
	async patchOrderingOfElements(
		@Param('roomid', ParseObjectIdPipe) roomId: string,
		@Body() params: PatchOrderParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.roomsUc.reorderBoardElements(roomId, currentUser.userId, params.elements);
	}
}
