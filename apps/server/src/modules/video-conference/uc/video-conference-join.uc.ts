import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId, UserDO, VideoConferenceDO } from '@shared/domain';
import { ErrorStatus } from '@src/modules/video-conference/error/error-status.enum';
import { UserService } from '@src/modules/user';
import { BBBJoinConfigBuilder, BBBRole, BBBService } from '../bbb';
import { ScopeRef, VideoConferenceJoin, VideoConferenceState } from './dto';
import { VideoConferenceService } from '../service';
import { PermissionMapping } from '../mapper/video-conference.mapper';

@Injectable()
export class VideoConferenceJoinUc {
	constructor(
		private readonly bbbService: BBBService,
		private readonly userService: UserService,
		private readonly videoConferenceService: VideoConferenceService
	) {}

	async join(currentUserId: EntityId, scope: ScopeRef): Promise<VideoConferenceJoin> {
		const user: UserDO = await this.userService.findById(currentUserId);

		await this.videoConferenceService.throwOnFeaturesDisabled(user.schoolId);

		const { role, isGuest } = await this.videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb(
			currentUserId,
			scope.id,
			scope.scope
		);

		const joinBuilder: BBBJoinConfigBuilder = new BBBJoinConfigBuilder({
			fullName: this.videoConferenceService.sanitizeString(`${user.firstName} ${user.lastName}`),
			meetingID: scope.id,
			role,
		})
			.withUserId(currentUserId)
			.asGuest(isGuest);

		const videoConference: VideoConferenceDO = await this.videoConferenceService.findVideoConferenceByScopeIdAndScope(
			scope.id,
			scope.scope
		);

		if (videoConference.options.everybodyJoinsAsModerator && !isGuest) {
			joinBuilder.withRole(BBBRole.MODERATOR);
		}

		if (
			videoConference.options.moderatorMustApproveJoinRequests &&
			!isGuest &&
			!videoConference.options.everybodyJoinsAsModerator
		) {
			joinBuilder.asGuest(true);
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
