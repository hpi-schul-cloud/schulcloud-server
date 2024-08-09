import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, Get, HttpStatus, Param, Put, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { InvalidOriginForLogoutUrlLoggableException } from '../error';
import { VideoConferenceOptions } from '../interface';
import { VideoConferenceMapper } from '../mapper/video-conference.mapper';
import { VideoConferenceCreateUc, VideoConferenceEndUc, VideoConferenceInfoUc, VideoConferenceJoinUc } from '../uc';
import { ScopeRef, VideoConferenceInfo, VideoConferenceJoin } from '../uc/dto';
import {
	VideoConferenceCreateParams,
	VideoConferenceInfoResponse,
	VideoConferenceJoinResponse,
	VideoConferenceScopeParams,
} from './dto';

@ApiTags('VideoConference')
@JwtAuthentication()
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
		@Req() req: Request,
		@CurrentUser() currentUser: ICurrentUser,
		@Param() scopeParams: VideoConferenceScopeParams,
		@Body() params: VideoConferenceCreateParams
	): Promise<void> {
		if (params.logoutUrl && new URL(params.logoutUrl).origin !== req.headers.origin) {
			throw new InvalidOriginForLogoutUrlLoggableException(params.logoutUrl, req.headers.origin);
		}

		const scopeRef = new ScopeRef(scopeParams.scopeId, scopeParams.scope);
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
		@Param() scopeParams: VideoConferenceScopeParams
	): Promise<VideoConferenceJoinResponse> {
		const scopeRef = new ScopeRef(scopeParams.scopeId, scopeParams.scope);
		const dto: VideoConferenceJoin = await this.videoConferenceJoinUc.join(currentUser.userId, scopeRef);

		const resp: VideoConferenceJoinResponse = VideoConferenceMapper.toVideoConferenceJoinResponse(dto);

		return resp;
	}

	@Get(':scope/:scopeId/info')
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
		@Param() scopeParams: VideoConferenceScopeParams
	): Promise<VideoConferenceInfoResponse> {
		const scopeRef = new ScopeRef(scopeParams.scopeId, scopeParams.scope);
		const dto: VideoConferenceInfo = await this.videoConferenceInfoUc.getMeetingInfo(currentUser.userId, scopeRef);

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
	})
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid parameters.' })
	@ApiResponse({
		status: HttpStatus.FORBIDDEN,
		description: 'User does not have the permission to end this conference.',
	})
	@ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Unable to fetch required data.' })
	async end(@CurrentUser() currentUser: ICurrentUser, @Param() scopeParams: VideoConferenceScopeParams): Promise<void> {
		const scopeRef = new ScopeRef(scopeParams.scopeId, scopeParams.scope);

		await this.videoConferenceEndUc.end(currentUser.userId, scopeRef);
	}
}
