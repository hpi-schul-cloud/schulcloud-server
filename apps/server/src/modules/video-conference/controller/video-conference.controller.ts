import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
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
import { VideoConferenceUc } from '@src/modules/video-conference/uc/video-conference.uc';
import { VideoConferenceResponseMapper } from '@src/modules/video-conference/mapper/vc-response.mapper';
import { BBBBaseResponse } from '@src/modules/video-conference/interface/bbb-response.interface';
import { VideoConferenceScope } from '@shared/domain/interface';
import {
	VideoConferenceDTO,
	VideoConferenceInfoDTO,
	VideoConferenceJoinDTO,
} from '@src/modules/video-conference/dto/video-conference.dto';
import { VideoConferenceState } from '@src/modules/video-conference/controller/dto/vc-state.enum';
import { defaultVideoConferenceOptions } from '@src/modules/video-conference/interface/vc-options.interface';
import { ICurrentUser } from '@src/modules/authentication/interface';
import { VideoConferenceBaseResponse, VideoConferenceInfoResponse } from './dto/video-conference.response';
import { VideoConferenceCreateParams } from './dto/video-conference.params';

@ApiTags('VideoConference')
@Authenticate('jwt')
@Controller('videoconference')
export class VideoConferenceController {
	constructor(
		private readonly videoConferenceUc: VideoConferenceUc,
		private readonly responseMapper: VideoConferenceResponseMapper
	) {}

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
		const infoDto: VideoConferenceInfoDTO = await this.videoConferenceUc.getMeetingInfo(currentUser, scope, scopeId);

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

		const dto: VideoConferenceJoinDTO = await this.videoConferenceUc.join(currentUser, scope, scopeId);

		return this.responseMapper.mapToJoinResponse(dto);
	}

	@Get(':scope/:scopeId')
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
		@Param('scope') scope: VideoConferenceScope,
		@Param('scopeId') scopeId: string
	): Promise<VideoConferenceInfoResponse> {
		const dto: VideoConferenceInfoDTO = await this.videoConferenceUc.getMeetingInfo(currentUser, scope, scopeId);
		return this.responseMapper.mapToInfoResponse(dto);
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
		const dto: VideoConferenceDTO<BBBBaseResponse> = await this.videoConferenceUc.end(currentUser, scope, scopeId);
		return this.responseMapper.mapToBaseResponse(dto);
	}
}
