import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { CopyApiResponse, CopyMapper } from '@modules/copy-helper';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequestTimeout } from '@shared/common';
import { RoomBoardResponseMapper } from '../mapper/room-board-response.mapper';
import { CourseCopyUC } from '../uc/course-copy.uc';
import { LessonCopyUC } from '../uc/lesson-copy.uc';
import { RoomsUc } from '../uc/rooms.uc';
import {
	LessonCopyApiParams,
	LessonUrlParams,
	PatchOrderParams,
	PatchVisibilityParams,
	RoomElementUrlParams,
	RoomUrlParams,
	SingleColumnBoardResponse,
} from './dto';

@ApiTags('Rooms')
@Authenticate('jwt')
@Controller('rooms')
export class RoomsController {
	constructor(
		private readonly roomsUc: RoomsUc,
		private readonly mapper: RoomBoardResponseMapper,
		private readonly courseCopyUc: CourseCopyUC,
		private readonly lessonCopyUc: LessonCopyUC
	) {}

	@Get(':roomId/board')
	async getRoomBoard(
		@Param() urlParams: RoomUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<SingleColumnBoardResponse> {
		const board = await this.roomsUc.getBoard(urlParams.roomId, currentUser.userId);
		const mapped = this.mapper.mapToResponse(board);
		return mapped;
	}

	@Patch(':roomId/elements/:elementId/visibility')
	async patchElementVisibility(
		@Param() urlParams: RoomElementUrlParams,
		@Body() params: PatchVisibilityParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.roomsUc.updateVisibilityOfLegacyBoardElement(
			urlParams.roomId,
			urlParams.elementId,
			currentUser.userId,
			params.visibility
		);
	}

	@Patch(':roomId/board/order')
	async patchOrderingOfElements(
		@Param() urlParams: RoomUrlParams,
		@Body() params: PatchOrderParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.roomsUc.reorderBoardElements(urlParams.roomId, currentUser.userId, params.elements);
	}

	@Post(':roomId/copy')
	@RequestTimeout('INCOMING_REQUEST_TIMEOUT_COPY_API')
	async copyCourse(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomUrlParams
	): Promise<CopyApiResponse> {
		const copyStatus = await this.courseCopyUc.copyCourse(currentUser.userId, urlParams.roomId);
		const dto = CopyMapper.mapToResponse(copyStatus);
		return dto;
	}

	@Post('lessons/:lessonId/copy')
	@RequestTimeout('INCOMING_REQUEST_TIMEOUT_COPY_API')
	async copyLesson(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: LessonUrlParams,
		@Body() params: LessonCopyApiParams
	): Promise<CopyApiResponse> {
		const copyStatus = await this.lessonCopyUc.copyLesson(
			currentUser.userId,
			urlParams.lessonId,
			CopyMapper.mapLessonCopyToDomain(params, currentUser.userId)
		);
		const dto = CopyMapper.mapToResponse(copyStatus);
		return dto;
	}
}
