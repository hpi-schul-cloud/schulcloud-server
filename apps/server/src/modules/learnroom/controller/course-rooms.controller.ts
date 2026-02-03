import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { CopyApiResponse, CopyMapper } from '@modules/copy-helper';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequestTimeout } from '@shared/common/decorators';
import { RoomBoardResponseMapper } from '../mapper/room-board-response.mapper';
import { LEARNROOM_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY } from '../timeout.config';
import { CourseCopyUC } from '../uc/course-copy.uc';
import { CourseRoomsUc } from '../uc/course-rooms.uc';
import { LessonCopyUC } from '../uc/lesson-copy.uc';
import {
	CourseRoomElementUrlParams,
	CourseRoomUrlParams,
	LessonCopyApiParams,
	LessonUrlParams,
	PatchOrderParams,
	PatchVisibilityParams,
	SingleColumnBoardResponse,
} from './dto';

/**
 * @deprecated - the learnroom module is deprecated and will be removed in the future
 */
@ApiTags('Course-Rooms')
@JwtAuthentication()
@Controller('course-rooms')
export class CourseRoomsController {
	constructor(
		private readonly roomsUc: CourseRoomsUc,
		private readonly mapper: RoomBoardResponseMapper,
		private readonly courseCopyUc: CourseCopyUC,
		private readonly lessonCopyUc: LessonCopyUC
	) {}

	@Get(':roomId/board')
	public async getRoomBoard(
		@Param() urlParams: CourseRoomUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<SingleColumnBoardResponse> {
		const board = await this.roomsUc.getBoard(urlParams.roomId, currentUser.userId);
		const mapped = this.mapper.mapToResponse(board);
		return mapped;
	}

	@Patch(':roomId/elements/:elementId/visibility')
	public async patchElementVisibility(
		@Param() urlParams: CourseRoomElementUrlParams,
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
	public async patchOrderingOfElements(
		@Param() urlParams: CourseRoomUrlParams,
		@Body() params: PatchOrderParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.roomsUc.reorderBoardElements(urlParams.roomId, currentUser.userId, params.elements);
	}

	@Post(':roomId/copy')
	@RequestTimeout(LEARNROOM_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY)
	public async copyCourse(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: CourseRoomUrlParams
	): Promise<CopyApiResponse> {
		const copyStatus = await this.courseCopyUc.copyCourse(currentUser.userId, urlParams.roomId);
		const dto = CopyMapper.mapToResponse(copyStatus);
		return dto;
	}

	@Post('lessons/:lessonId/copy')
	@RequestTimeout(LEARNROOM_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY)
	public async copyLesson(
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
