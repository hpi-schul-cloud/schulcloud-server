import { UserService } from '@modules/user';
import { ErrorStatus } from '@modules/video-conference/error/error-status.enum';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserDO, VideoConferenceDO, VideoConferenceOptionsDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { BBBBaseMeetingConfig, BBBMeetingInfoResponse, BBBResponse, BBBRole, BBBService } from '../bbb';
import { defaultVideoConferenceOptions, VideoConferenceOptions } from '../interface';
import { PermissionMapping } from '../mapper/video-conference.mapper';
import { VideoConferenceService } from '../service';
import { ScopeInfo, ScopeRef, VideoConferenceInfo, VideoConferenceState } from './dto';
import { VideoConferenceScope } from '@shared/domain/interface';
import { BoardContextApiHelperService } from '@src/modules/board-context';

@Injectable()
export class VideoConferenceInfoUc {
	constructor(
		private readonly bbbService: BBBService,
		private readonly userService: UserService,
		private readonly videoConferenceService: VideoConferenceService,
		private readonly boardContextApiHelperService: BoardContextApiHelperService
	) {}

	async getMeetingInfo(currentUserId: EntityId, scope: ScopeRef): Promise<VideoConferenceInfo> {
		/* need to be replace with
		const [authorizableUser, scopeResource]: [User, TeamEntity | Course] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.videoConferenceService.loadScopeResources(scopeId, scope),
		]);
		*/
		const user: UserDO = await this.userService.findById(currentUserId);

		const schoolId =
			scope.scope === VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT
				? await this.boardContextApiHelperService.getSchoolIdForBoardNode(scope.id)
				: user.schoolId;

		await this.videoConferenceService.throwOnFeaturesDisabled(schoolId);

		const scopeInfo: ScopeInfo = await this.videoConferenceService.getScopeInfo(currentUserId, scope.id, scope.scope);

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
