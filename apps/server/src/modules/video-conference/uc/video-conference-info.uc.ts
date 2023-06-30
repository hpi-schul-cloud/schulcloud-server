import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId, UserDO, VideoConferenceDO, VideoConferenceOptionsDO } from '@shared/domain';
import { ErrorStatus } from '@src/modules/video-conference/error/error-status.enum';
import { UserService } from '@src/modules/user';
import { BBBBaseMeetingConfig, BBBMeetingInfoResponse, BBBResponse, BBBRole, BBBService } from '../bbb';
import { IScopeInfo, ScopeRef, VideoConferenceInfo, VideoConferenceState } from './dto';
import { VideoConferenceService } from '../service';
import { PermissionMapping } from '../mapper/video-conference.mapper';
import { defaultVideoConferenceOptions, VideoConferenceOptions } from '../interface';

@Injectable()
export class VideoConferenceInfoUc {
	constructor(
		private readonly bbbService: BBBService,
		private readonly userService: UserService,
		private readonly videoConferenceService: VideoConferenceService
	) {}

	async getMeetingInfo(currentUserId: EntityId, scope: ScopeRef): Promise<VideoConferenceInfo> {
		const user: UserDO = await this.userService.findById(currentUserId);

		await this.videoConferenceService.throwOnFeaturesDisabled(user.schoolId);

		const scopeInfo: IScopeInfo = await this.videoConferenceService.getScopeInfo(currentUserId, scope.id, scope.scope);

		const bbbRole: BBBRole = await this.videoConferenceService.determineBbbRole(
			currentUserId,
			scopeInfo.scopeId,
			scope.scope
		);

		const config: BBBBaseMeetingConfig = new BBBBaseMeetingConfig({
			meetingID: scope.id,
		});

		const options: VideoConferenceOptionsDO = await this.getVideoConferenceOptions(scope);

		let response: VideoConferenceInfo;
		try {
			const bbbResponse: BBBResponse<BBBMeetingInfoResponse> = await this.bbbService.getMeetingInfo(config);
			response = new VideoConferenceInfo({
				state: VideoConferenceState.RUNNING,
				permission: PermissionMapping[bbbRole],
				bbbResponse,
				options: bbbRole === BBBRole.MODERATOR ? options : ({} as VideoConferenceOptions),
			});
		} catch {
			response = new VideoConferenceInfo({
				state: VideoConferenceState.NOT_STARTED,
				permission: PermissionMapping[bbbRole],
				options: bbbRole === BBBRole.MODERATOR ? options : ({} as VideoConferenceOptions),
			});
		}

		const isGuest: boolean = await this.videoConferenceService.hasExpertRole(
			currentUserId,
			scope.scope,
			scopeInfo.scopeId
		);

		if (!this.videoConferenceService.canGuestJoin(isGuest, response.state, options.moderatorMustApproveJoinRequests)) {
			throw new ForbiddenException(ErrorStatus.GUESTS_CANNOT_JOIN_CONFERENCE);
		}

		return response;
	}

	private async getVideoConferenceOptions(scope: ScopeRef): Promise<VideoConferenceOptionsDO> {
		let options: VideoConferenceOptionsDO;
		try {
			const vcDO: VideoConferenceDO = await this.videoConferenceService.findVideoConferenceByScopeIdAndScope(
				scope.id,
				scope.scope
			);
			options = vcDO.options;
		} catch {
			options = defaultVideoConferenceOptions;
		}
		return options;
	}
}
