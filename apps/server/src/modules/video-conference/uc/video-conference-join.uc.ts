import { UserService } from '@modules/user';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserDO, VideoConferenceDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { BBBJoinConfigBuilder, BBBRole, BBBService } from '../bbb';
import { ErrorStatus } from '../error/error-status.enum';
import { PermissionMapping } from '../mapper/video-conference.mapper';
import { VideoConferenceService } from '../service';
import { ScopeRef, VideoConferenceJoin, VideoConferenceState } from './dto';
import { VideoConferenceFeatureService } from './video-conference-feature.service';

@Injectable()
export class VideoConferenceJoinUc {
	constructor(
		private readonly bbbService: BBBService,
		private readonly userService: UserService,
		private readonly videoConferenceService: VideoConferenceService,
		private readonly videoConferenceFeatureService: VideoConferenceFeatureService
	) {}

	public async join(currentUserId: EntityId, scope: ScopeRef): Promise<VideoConferenceJoin> {
		await this.videoConferenceFeatureService.checkVideoConferenceFeatureEnabled(currentUserId, scope);

		const { role, isGuest } = await this.videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb(
			currentUserId,
			scope.id,
			scope.scope
		);

		const user: UserDO = await this.userService.findById(currentUserId);

		const joinBuilder: BBBJoinConfigBuilder = new BBBJoinConfigBuilder({
			fullName: this.videoConferenceService.sanitizeString(`${user.firstName} ${user.lastName}`),
			meetingID: scope.id,
			role,
		}).withUserId(currentUserId);

		const videoConference: VideoConferenceDO = await this.videoConferenceService.findVideoConferenceByScopeIdAndScope(
			scope.id,
			scope.scope
		);

		if (isGuest) {
			joinBuilder.asGuest(true);
		}

		if (videoConference.options.everybodyJoinsAsModerator && !isGuest) {
			joinBuilder.withRole(BBBRole.MODERATOR);
		}

		if (!videoConference.options.moderatorMustApproveJoinRequests && isGuest) {
			throw new ForbiddenException(
				ErrorStatus.GUESTS_CANNOT_JOIN_CONFERENCE,
				'Guests cannot join this conference, since the waiting room is not enabled.'
			);
		}

		const url: string = await this.bbbService.join(joinBuilder.build());

		const videoConferenceJoin: VideoConferenceJoin = new VideoConferenceJoin({
			state: VideoConferenceState.RUNNING,
			permission: PermissionMapping[role],
			url,
		});
		return videoConferenceJoin;
	}
}
