import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@shared/controller';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { LessonCopyUc } from '@src/modules/learnroom/uc/lesson-copy.uc';
import { CopyMapper } from '../mapper/copy.mapper';
import { RoomBoardResponseMapper } from '../mapper/room-board-response.mapper';
import { CourseCopyUC } from '../uc/course-copy.uc';
import { RoomsUc } from '../uc/rooms.uc';
import { BoardResponse, PatchOrderParams, PatchVisibilityParams } from './dto';
import { CopyApiResponse } from './dto/copy.response';

@ApiTags('Rooms')
@Authenticate('jwt')
@Controller('rooms')
export class RoomsController {
	constructor(
		private readonly roomsUc: RoomsUc,
		private readonly mapper: RoomBoardResponseMapper,
		private readonly courseCopyUc: CourseCopyUC,
		private readonly lessonCopyUc: LessonCopyUc
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
		@Param('roomid', ParseObjectIdPipe) courseId: string
	): Promise<CopyApiResponse> {
		const copyStatus = await this.courseCopyUc.copyCourse(currentUser.userId, courseId);
		const dto = CopyMapper.mapToResponse(copyStatus);
		return dto;
	}

	@Post('lessons/:lessonid/copy')
	async copyLesson(
		@CurrentUser() currentUser: ICurrentUser,
		@Param('lessonid', ParseObjectIdPipe) lessonId: string
	): Promise<CopyApiResponse> {
		const copyStatus = await this.lessonCopyUc.copyLesson(currentUser.userId, lessonId);
		const dto = CopyMapper.mapToResponse(copyStatus);
		return dto;
	}
}
