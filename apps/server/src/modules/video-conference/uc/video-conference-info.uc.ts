import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BBBBaseMeetingConfig, BBBMeetingInfoResponse, BBBResponse, BBBRole, BBBService } from '../bbb';
import { VideoConferenceDO, VideoConferenceOptionsDO } from '../domain';
import { ErrorStatus } from '../error';
import { defaultVideoConferenceOptions } from '../interface';
import { PermissionMapping } from '../mapper/video-conference.mapper';
import { VideoConferenceService } from '../service';
import { ScopeInfo, ScopeRef, VideoConferenceInfo, VideoConferenceState } from './dto';
import { VideoConferenceFeatureService } from './video-conference-feature.service';

@Injectable()
export class VideoConferenceInfoUc {
	constructor(
		private readonly bbbService: BBBService,
		private readonly videoConferenceService: VideoConferenceService,
		private readonly videoConferenceFeatureService: VideoConferenceFeatureService
	) {}

	public async getMeetingInfo(currentUserId: EntityId, scope: ScopeRef): Promise<VideoConferenceInfo> {
		await this.videoConferenceFeatureService.checkVideoConferenceFeatureEnabled(currentUserId, scope);

		const scopeInfo: ScopeInfo = await this.videoConferenceService.getScopeInfo(currentUserId, scope.id, scope.scope);

		const bbbRole: BBBRole = await this.videoConferenceService.determineBbbRole(
			currentUserId,
			scopeInfo.scopeId,
			scope.scope
		);

		let options: VideoConferenceOptionsDO = await this.getVideoConferenceOptions(scope);

		let state: VideoConferenceState = VideoConferenceState.NOT_STARTED;
		let bbbResponse: BBBResponse<BBBMeetingInfoResponse> | undefined;
		try {
			const videoConference = await this.videoConferenceService.findVideoConferenceByScopeIdAndScope(
				scope.id,
				scope.scope
			);

			if (bbbRole === BBBRole.MODERATOR) {
				options = videoConference.options;
			}

			const config: BBBBaseMeetingConfig = new BBBBaseMeetingConfig({
				meetingID: scope.id + videoConference.salt,
			});

			bbbResponse = await this.bbbService.getMeetingInfo(config);
			state = VideoConferenceState.RUNNING;
		} catch (e) {
			// TODO should be refactored to not use exceptions for flow control
		}

		const isGuest: boolean = await this.videoConferenceService.hasExpertRole(
			currentUserId,
			scope.scope,
			scopeInfo.scopeId
		);

		if (!this.videoConferenceService.canGuestJoin(isGuest, state, options.moderatorMustApproveJoinRequests)) {
			throw new ForbiddenException(ErrorStatus.GUESTS_CANNOT_JOIN_CONFERENCE);
		}

		if (isGuest && state === VideoConferenceState.RUNNING) {
			options = {} as VideoConferenceOptionsDO;
		}

		const response = new VideoConferenceInfo({
			state,
			permission: PermissionMapping[bbbRole],
			bbbResponse,
			options,
		});

		return response;
	}

	private async getVideoConferenceOptions(scope: ScopeRef): Promise<VideoConferenceOptionsDO> {
		let options: VideoConferenceOptionsDO;
		try {
			const vcDO: VideoConferenceDO = await this.videoConferenceService.findVideoConferenceByScopeIdAndScope(
				scope.id,
				scope.scope
			);
			options = { ...vcDO.options };
		} catch {
			// TODO why should return anything if videoconference not found?
			options = defaultVideoConferenceOptions;
		}
		return options;
	}
}
