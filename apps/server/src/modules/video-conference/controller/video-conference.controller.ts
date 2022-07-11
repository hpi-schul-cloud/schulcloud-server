import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
import {
	BadRequestException,
	Body,
	Controller,
	ForbiddenException,
	Get,
	InternalServerErrorException,
	Param,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VideoConferenceUc } from '@src/modules/video-conference/uc/video-conference.uc';
import { VideoConferenceResponseMapper } from '@src/modules/video-conference/mapper/vc-response.mapper';
import {
	BBBBaseResponse,
	BBBCreateResponse,
	BBBJoinResponse,
	BBBMeetingInfoResponse,
	BBBResponse,
} from '@src/modules/video-conference/interface/bbb-response.interface';
import { VideoConferenceScope } from '@shared/domain/interface/vc-scope.enum';
import {
	VideoConferenceBaseResponse,
	VideoConferenceCreateResponse,
	VideoConferenceInfoResponse,
	VideoConferenceJoinResponse,
} from './dto/video-conference.response';
import { VideoConferenceCreateParams } from './dto/video-conference.params';

@ApiTags('VideoConference')
@Authenticate('jwt')
@Controller('video-conference')
export class VideoConferenceController {
	constructor(
		private readonly videoConferenceUc: VideoConferenceUc,
		private readonly responseMapper: VideoConferenceResponseMapper
	) {}

	@Get(':scope/:scopeId')
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
		@Param() scope: VideoConferenceScope,
		@Param() scopeId: string,
		@Body() params: VideoConferenceCreateParams
	): Promise<VideoConferenceCreateResponse> {
		const bbbResponse: BBBResponse<BBBCreateResponse> = await this.videoConferenceUc.create(
			currentUser,
			scope,
			scopeId,
			{
				everyAttendeeJoinsMuted: params.everyAttendeeJoinsMuted,
				everybodyJoinsAsModerator: params.everybodyJoinsAsModerator,
				moderatorMustApproveJoinRequests: params.moderatorMustApproveJoinRequests,
			}
		);
		return this.responseMapper.mapToCreateResponse(bbbResponse);
	}

	@Get(':scope/:scopeId')
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
		@Param() scope: VideoConferenceScope,
		@Param() scopeId: string
	): Promise<VideoConferenceJoinResponse> {
		const bbbResponse: BBBResponse<BBBJoinResponse> = await this.videoConferenceUc.join(currentUser, scope, scopeId);
		return this.responseMapper.mapToJoinResponse(bbbResponse);
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
		@Param() scope: VideoConferenceScope,
		@Param() scopeId: string
	): Promise<VideoConferenceInfoResponse> {
		const bbbResponse: BBBResponse<BBBMeetingInfoResponse> = await this.videoConferenceUc.getMeetingInfo(
			currentUser,
			scope,
			scopeId
		);
		return this.responseMapper.mapToInfoResponse(bbbResponse);
	}

	@Get(':scope/:scopeId')
	@ApiOperation({
		summary: 'Ends a running video conference.',
	})
	@ApiResponse({
		status: 200,
		type: VideoConferenceBaseResponse,
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
		@Param() scope: VideoConferenceScope,
		@Param() scopeId: string
	): Promise<VideoConferenceBaseResponse> {
		const bbbResponse: BBBResponse<BBBBaseResponse> = await this.videoConferenceUc.end(currentUser, scope, scopeId);
		return this.responseMapper.mapToBaseResponse(bbbResponse);
	}
}
