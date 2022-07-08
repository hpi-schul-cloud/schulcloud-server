import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { EntityId, ICurrentUser } from '@shared/domain';
import { BadRequestException, Controller, ForbiddenException, Get, InternalServerErrorException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VideoConferenceJoinResponse } from '@src/modules/video-conference/controller/dto/vc-join.response';
import { VideoConferenceCreateResponse } from '@src/modules/video-conference/controller/dto/vc-create.response';
import { VideoConferenceUc } from '@src/modules/video-conference/uc/video-conference.uc';
import { VideoConferenceResponseMapper } from '@src/modules/video-conference/mapper/vc-response.mapper';
import {
	BBBBaseResponse,
	BBBCreateResponse,
	BBBJoinResponse,
	BBBMeetingInfoResponse,
	BBBResponse,
} from '@src/modules/video-conference/interface/bbb-response.interface';
import { VideoConferenceInfoResponse } from '@src/modules/video-conference/controller/dto/vc-info.response';
import { VideoConferenceScope } from '@shared/domain/interface/vc-scope.enum';

@ApiTags('VideoConference')
@Authenticate('jwt')
@Controller('video-conference')
export class VideoConferenceController {
	constructor(private readonly videoConferenceUc: VideoConferenceUc) {}

	@Get()
	@ApiOperation({
		summary: 'Creates a new video conference for a given scope.',
	})
	@ApiResponse({
		status: 200,
		type: VideoConferenceCreateResponse,
		description: 'Returns information about the created video conference.',
	})
	@ApiResponse({ status: 400, type: BadRequestException, description: 'Invalid parameters.' })
	@ApiResponse({
		status: 403,
		type: ForbiddenException,
		description: 'User does not have the permission to create this conference.',
	})
	@ApiResponse({ status: 500, type: InternalServerErrorException, description: 'Unable to fetch required data.' })
	async create(
		@CurrentUser() currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId
	): Promise<VideoConferenceCreateResponse> {
		const bbbResponse: BBBResponse<BBBCreateResponse> = await this.videoConferenceUc.create(
			currentUser,
			conferenceScope,
			refId,
			{ everybodyJoinsAsModerator: false, moderatorMustApproveJoinRequests: false, everyAttendeeJoinsMuted: false } // TODO
		);
		return VideoConferenceResponseMapper.mapToCreateResponse(bbbResponse);
	}

	@Get()
	@ApiOperation({
		summary: 'Returns a join link for a video conference.',
	})
	@ApiResponse({
		status: 200,
		type: VideoConferenceJoinResponse,
		description: 'Returns a valid join link for a video conference.',
	})
	@ApiResponse({ status: 400, type: BadRequestException, description: 'Invalid parameters.' })
	@ApiResponse({
		status: 403,
		type: ForbiddenException,
		description: 'User does not have the permission to join this conference.',
	})
	@ApiResponse({ status: 500, type: InternalServerErrorException, description: 'Unable to fetch required data.' })
	async join(
		@CurrentUser() currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId
	): Promise<VideoConferenceJoinResponse> {
		const bbbResponse: BBBResponse<BBBJoinResponse> = await this.videoConferenceUc.join(
			currentUser,
			conferenceScope,
			refId
		);
		return VideoConferenceResponseMapper.mapToJoinResponse(bbbResponse);
	}

	@Get()
	@ApiOperation({
		summary: 'Returns information about a running video conference.',
	})
	@ApiResponse({
		status: 200,
		type: VideoConferenceInfoResponse,
		description: 'Returns a list of information about a video conference.',
	})
	@ApiResponse({ status: 400, type: BadRequestException, description: 'Invalid parameters.' })
	@ApiResponse({
		status: 403,
		type: ForbiddenException,
		description: 'User does not have the permission to get information about this conference.',
	})
	@ApiResponse({ status: 500, type: InternalServerErrorException, description: 'Unable to fetch required data.' })
	async info(
		@CurrentUser() currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId
	): Promise<VideoConferenceJoinResponse> {
		const bbbResponse: BBBResponse<BBBMeetingInfoResponse> = await this.videoConferenceUc.getMeetingInfo(
			currentUser,
			conferenceScope,
			refId
		);
		return VideoConferenceResponseMapper.mapToInfoResponse(bbbResponse);
	}

	@Get()
	@ApiOperation({
		summary: 'Ends a running video conference.',
	})
	@ApiResponse({
		status: 200,
		type: VideoConferenceInfoResponse,
		description: 'Returns a list of information about a video conference.',
	})
	@ApiResponse({ status: 400, type: BadRequestException, description: 'Invalid parameters.' })
	@ApiResponse({
		status: 403,
		type: ForbiddenException,
		description: 'User does not have the permission to get information about this conference.',
	})
	@ApiResponse({ status: 500, type: InternalServerErrorException, description: 'Unable to fetch required data.' })
	async end(
		@CurrentUser() currentUser: ICurrentUser,
		conferenceScope: VideoConferenceScope,
		refId: EntityId
	): Promise<VideoConferenceJoinResponse> {
		const bbbResponse: BBBResponse<BBBBaseResponse> = await this.videoConferenceUc.end(
			currentUser,
			conferenceScope,
			refId
		);
		return VideoConferenceResponseMapper.mapToBaseResponse(bbbResponse);
	}
}
