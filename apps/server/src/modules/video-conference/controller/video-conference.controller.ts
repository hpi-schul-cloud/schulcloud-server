import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, HttpStatus, Param, Put } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { VideoConferenceScope } from '@shared/domain';
import { ICurrentUser } from '@src/modules/authentication';
import { VideoConference, VideoConferenceBaseResponse, VideoConferenceCreateParams } from './dto';
import { VideoConferenceJoinUc, VideoConferenceCreateUc, VideoConferenceEndUc, VideoConferenceInfoUc } from '../uc';
import { VideoConferenceInfoResponse, VideoConferenceJoinResponse } from './dto/response';
import { ScopeRef, VideoConferenceInfo, VideoConferenceJoin } from '../uc/dto';
import { VideoConferenceMapper } from '../mapper/video-conference.mapper';
import { VideoConferenceOptions } from '../interface';
import { BBBBaseResponse } from '../bbb';

@ApiTags('VideoConference')
@Authenticate('jwt')
@Controller('videoconference2')
export class VideoConferenceController {
	constructor(
		private readonly videoConferenceCreateUc: VideoConferenceCreateUc,
		private readonly videoConferenceJoinUc: VideoConferenceJoinUc,
		private readonly videoConferenceEndUc: VideoConferenceEndUc,
		private readonly videoConferenceInfoUc: VideoConferenceInfoUc
	) {}

	@Put(':scope/:scopeId/start')
	@ApiOperation({
		summary: 'Creates the video conference, if it has not started yet.',
		description:
			'Use this endpoint to start a video conference. If the conference is not yet running, it will be created.',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Video conference was created.',
	})
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid parameters.' })
	@ApiResponse({
		status: HttpStatus.FORBIDDEN,
		description: 'User does not have the permission to create this conference.',
	})
	@ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Unable to fetch required data.' })
	async start(
		@CurrentUser() currentUser: ICurrentUser,
		@Param('scope') scope: VideoConferenceScope,
		@Param('scopeId') scopeId: string,
		@Body() params: VideoConferenceCreateParams
	): Promise<void> {
		const scopeRef = new ScopeRef(scopeId, scope);
		const videoConferenceOptions: VideoConferenceOptions = VideoConferenceMapper.toVideoConferenceOptions(params);

		await this.videoConferenceCreateUc.createIfNotRunning(currentUser.userId, scopeRef, videoConferenceOptions);
	}

	@Get(':scope/:scopeId/join')
	@ApiOperation({
		summary: 'Creates a join link for a video conference, if it has started.',
		description:
			'Use this endpoint to get a link to join an existing video conference. The conference must be running.',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Returns the information for joining the conference.',
		type: VideoConferenceJoinResponse,
	})
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid parameters.' })
	@ApiResponse({
		status: HttpStatus.FORBIDDEN,
		description: 'User does not have the permission to join this conference.',
	})
	@ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Unable to fetch required data.' })
	async join(
		@CurrentUser() currentUser: ICurrentUser,
		@Param('scope') scope: VideoConferenceScope,
		@Param('scopeId') scopeId: string
	): Promise<VideoConferenceJoinResponse> {
		const dto: VideoConferenceJoin = await this.videoConferenceJoinUc.join(
			currentUser.userId,
			new ScopeRef(scopeId, scope)
		);

		const resp: VideoConferenceJoinResponse = VideoConferenceMapper.toVideoConferenceJoinResponse(dto);

		return resp;
	}

	@Get(':scope/:scopeId')
	@ApiOperation({
		summary: 'Returns information about a running video conference.',
		description: 'Use this endpoint to get information about a running video conference.',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Returns a list of information about a video conference.',
		type: VideoConferenceInfoResponse,
	})
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid parameters.' })
	@ApiResponse({
		status: HttpStatus.FORBIDDEN,
		description: 'User does not have the permission to get information about this conference.',
	})
	@ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Unable to fetch required data.' })
	async info(
		@CurrentUser() currentUser: ICurrentUser,
		@Param('scope') scope: VideoConferenceScope,
		@Param('scopeId') scopeId: string
	): Promise<VideoConferenceInfoResponse> {
		const dto: VideoConferenceInfo = await this.videoConferenceInfoUc.getMeetingInfo(
			currentUser.userId,
			new ScopeRef(scopeId, scope)
		);

		const resp: VideoConferenceInfoResponse = VideoConferenceMapper.toVideoConferenceInfoResponse(dto);

		return resp;
	}

	@Get(':scope/:scopeId/end')
	@ApiOperation({
		summary: 'Ends a running video conference.',
		description: 'Use this endpoint to end a running video conference.',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Returns the status of the operation.',
		type: VideoConferenceBaseResponse,
	})
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid parameters.' })
	@ApiResponse({
		status: HttpStatus.FORBIDDEN,
		description: 'User does not have the permission to end this conference.',
	})
	@ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Unable to fetch required data.' })
	async end(
		@CurrentUser() currentUser: ICurrentUser,
		@Param('scope') scope: VideoConferenceScope,
		@Param('scopeId') scopeId: string
	): Promise<VideoConferenceBaseResponse> {
		const dto: VideoConference<BBBBaseResponse> = await this.videoConferenceEndUc.end(
			currentUser.userId,
			new ScopeRef(scopeId, scope)
		);

		const resp: VideoConferenceBaseResponse = VideoConferenceMapper.toVideoConferenceBaseResponse(dto);

		return resp;
	}
}
