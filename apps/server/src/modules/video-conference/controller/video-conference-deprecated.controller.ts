import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	InternalServerErrorException,
	Param,
	Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VideoConferenceScope } from '@shared/domain/interface';
import { BBBBaseResponse } from '../bbb';
import { defaultVideoConferenceOptions } from '../interface';
import { VideoConferenceResponseDeprecatedMapper } from '../mapper/vc-deprecated-response.mapper';
import { VideoConferenceDeprecatedUc } from '../uc';
import { VideoConference, VideoConferenceInfo, VideoConferenceJoin, VideoConferenceState } from '../uc/dto';
import { VideoConferenceCreateParams } from './dto';
import {
	DeprecatedVideoConferenceInfoResponse,
	VideoConferenceBaseResponse,
} from './dto/response/video-conference-deprecated.response';

/**
 * This controller is deprecated. Please use {@link VideoConferenceController} instead.
 */
@ApiTags('VideoConference')
@JwtAuthentication()
@Controller('videoconference')
export class VideoConferenceDeprecatedController {
	constructor(private readonly videoConferenceUc: VideoConferenceDeprecatedUc) {}

	@Post(':scope/:scopeId')
	@ApiOperation({
		summary: 'Creates a join link for a video conference and creates the video conference, if it has not started yet.',
	})
	@ApiResponse({ status: 400, type: BadRequestException, description: 'Invalid parameters.' })
	@ApiResponse({
		status: 403,
		type: ForbiddenException,
		description: 'User does not have the permission to create this conference.',
	})
	@ApiResponse({ status: 500, type: InternalServerErrorException, description: 'Unable to fetch required data.' })
	async createAndJoin(
		@CurrentUser() currentUser: ICurrentUser,
		@Param('scope') scope: VideoConferenceScope,
		@Param('scopeId') scopeId: string,
		@Body() params: VideoConferenceCreateParams
	): Promise<VideoConferenceBaseResponse> {
		const infoDto: VideoConferenceInfo = await this.videoConferenceUc.getMeetingInfo(currentUser, scope, scopeId);

		if (infoDto.state !== VideoConferenceState.RUNNING) {
			await this.videoConferenceUc.create(currentUser, scope, scopeId, {
				everyAttendeeJoinsMuted:
					params.everyAttendeeJoinsMuted ?? defaultVideoConferenceOptions.everyAttendeeJoinsMuted,
				everybodyJoinsAsModerator:
					params.everybodyJoinsAsModerator ?? defaultVideoConferenceOptions.everybodyJoinsAsModerator,
				moderatorMustApproveJoinRequests:
					params.moderatorMustApproveJoinRequests ?? defaultVideoConferenceOptions.moderatorMustApproveJoinRequests,
			});
		}

		const dto: VideoConferenceJoin = await this.videoConferenceUc.join(currentUser, scope, scopeId);

		return VideoConferenceResponseDeprecatedMapper.mapToJoinResponse(dto);
	}

	@Get(':scope/:scopeId')
	@ApiOperation({
		summary: 'Returns information about a running video conference.',
	})
	@ApiResponse({
		status: 200,
		type: DeprecatedVideoConferenceInfoResponse,
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
		@Param('scope') scope: VideoConferenceScope,
		@Param('scopeId') scopeId: string
	): Promise<DeprecatedVideoConferenceInfoResponse> {
		const dto: VideoConferenceInfo = await this.videoConferenceUc.getMeetingInfo(currentUser, scope, scopeId);
		return VideoConferenceResponseDeprecatedMapper.mapToInfoResponse(dto);
	}

	@Delete(':scope/:scopeId')
	@ApiOperation({
		summary: 'Ends a running video conference.',
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
		@Param('scope') scope: VideoConferenceScope,
		@Param('scopeId') scopeId: string
	): Promise<VideoConferenceBaseResponse> {
		const dto: VideoConference<BBBBaseResponse> = await this.videoConferenceUc.end(currentUser, scope, scopeId);
		return VideoConferenceResponseDeprecatedMapper.mapToBaseResponse(dto);
	}
}
