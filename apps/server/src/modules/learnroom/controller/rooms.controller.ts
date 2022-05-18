import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@shared/controller';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { CourseCopyMapper } from '../mapper/course-copy.mapper';
import { RoomBoardResponseMapper } from '../mapper/room-board-response.mapper';
import { CourseCopyUC } from '../uc/course-copy.uc';
import { RoomsUc } from '../uc/rooms.uc';
import { BoardResponse, PatchOrderParams, PatchVisibilityParams } from './dto';
import { CourseCopyApiResponse } from './dto/course-copy.response';

@ApiTags('Rooms')
@Authenticate('jwt')
@Controller('rooms')
export class RoomsController {
	constructor(
		private readonly roomsUc: RoomsUc,
		private readonly mapper: RoomBoardResponseMapper,
		private readonly courseCopyUc: CourseCopyUC
	) {}

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

	@Post(':roomid/copy')
	async copyCourse(
		@CurrentUser() currentUser: ICurrentUser,
		@Param('id', ParseObjectIdPipe) courseId: string
	): Promise<CourseCopyApiResponse> {
		const copyStatus = await this.courseCopyUc.copyCourse(currentUser.userId, courseId);
		const dto = CourseCopyMapper.mapToResponse(copyStatus);
		return dto;
	}
}
