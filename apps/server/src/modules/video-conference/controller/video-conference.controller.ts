import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
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
	VideoConferenceInfoResponse,
	VideoConferenceJoinResponse,
} from './dto/video-conference.response';
import { VideoConferenceCreateParams } from './dto/video-conference.params';
import { VideoConferenceDTO, VideoConferenceInfoDTO } from '@src/modules/video-conference/dto/video-conference.dto';

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
		summary: 'Creates a new video conference for a given scope.',
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
		@Param('scope') scope: VideoConferenceScope,
		@Param('scopeId') scopeId: string,
		@Body() params: VideoConferenceCreateParams
	): Promise<VideoConferenceBaseResponse> {
		const dto: VideoConferenceDTO<BBBCreateResponse> = await this.videoConferenceUc.create(
			currentUser,
			scope,
			scopeId,
			{
				everyAttendeeJoinsMuted: params.everyAttendeeJoinsMuted ?? false,
				everybodyJoinsAsModerator: params.everybodyJoinsAsModerator ?? false,
				moderatorMustApproveJoinRequests: params.moderatorMustApproveJoinRequests ?? false,
			}
		);
		const dto2: VideoConferenceDTO<BBBJoinResponse> = await this.videoConferenceUc.join(currentUser, scope, scopeId);

		return this.responseMapper.mapToJoinResponse(dto2);
	}

	@Post('join/:scope/:scopeId')
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
		@Param('scope') scope: VideoConferenceScope,
		@Param('scopeId') scopeId: string
	): Promise<VideoConferenceJoinResponse> {
		const bbbResponse: VideoConferenceDTO<BBBJoinResponse> = await this.videoConferenceUc.join(
			currentUser,
			scope,
			scopeId
		);
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
