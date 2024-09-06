import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { CopyApiResponse, CopyMapper } from '@modules/copy-helper';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequestTimeout } from '@shared/common';
import { RoomBoardResponseMapper } from '../mapper/room-board-response.mapper';
import { CourseCopyUC } from '../uc/course-copy.uc';
import { LessonCopyUC } from '../uc/lesson-copy.uc';
import { CourseRoomsUc } from '../uc/course-rooms.uc';
import {
	LessonCopyApiParams,
	LessonUrlParams,
	PatchOrderParams,
	PatchVisibilityParams,
	CourseRoomElementUrlParams,
	CourseRoomUrlParams,
	SingleColumnBoardResponse,
} from './dto';

// TODO: remove this file, and remove it from sonar-project.properties

@ApiTags('Rooms')
@JwtAuthentication()
@Controller('rooms')
export class RoomsController {
	constructor(
		private readonly roomsUc: CourseRoomsUc,
		private readonly mapper: RoomBoardResponseMapper,
		private readonly courseCopyUc: CourseCopyUC,
		private readonly lessonCopyUc: LessonCopyUC
	) {}

	@Get(':roomId/board')
	async getRoomBoard(
		@Param() urlParams: CourseRoomUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<SingleColumnBoardResponse> {
		const board = await this.roomsUc.getBoard(urlParams.roomId, currentUser.userId);
		const mapped = this.mapper.mapToResponse(board);
		return mapped;
	}

	@Patch(':roomId/elements/:elementId/visibility')
	async patchElementVisibility(
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
	async patchOrderingOfElements(
		@Param() urlParams: CourseRoomUrlParams,
		@Body() params: PatchOrderParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.roomsUc.reorderBoardElements(urlParams.roomId, currentUser.userId, params.elements);
	}

	@Post(':roomId/copy')
	@RequestTimeout('INCOMING_REQUEST_TIMEOUT_COPY_API')
	async copyCourse(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: CourseRoomUrlParams
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
