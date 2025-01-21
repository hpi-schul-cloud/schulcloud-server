import { BoardContextApiHelperService } from '@modules/board-context';
import { UserService } from '@modules/user';
import { ErrorStatus } from '@modules/video-conference/error/error-status.enum';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserDO, VideoConferenceDO } from '@shared/domain/domainobject';
import { VideoConferenceScope } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { BBBJoinConfigBuilder, BBBRole, BBBService } from '../bbb';
import { PermissionMapping } from '../mapper/video-conference.mapper';
import { VideoConferenceService } from '../service';
import { ScopeRef, VideoConferenceJoin, VideoConferenceState } from './dto';

@Injectable()
export class VideoConferenceJoinUc {
	constructor(
		private readonly bbbService: BBBService,
		private readonly userService: UserService,
		private readonly videoConferenceService: VideoConferenceService,
		private readonly boardContextApiHelperService: BoardContextApiHelperService,
	) {}

	public async join(currentUserId: EntityId, scope: ScopeRef): Promise<VideoConferenceJoin> {
		const user: UserDO = await this.userService.findById(currentUserId);

		const schoolId =
			scope.scope === VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT
				? await this.boardContextApiHelperService.getSchoolIdForBoardNode(scope.id)
				: user.schoolId;

		await this.videoConferenceService.throwOnFeaturesDisabled(schoolId);

		const { role, isGuest } = await this.videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb(
			currentUserId,
			scope.id,
			scope.scope,
		);

		const joinBuilder: BBBJoinConfigBuilder = new BBBJoinConfigBuilder({
			fullName: this.videoConferenceService.sanitizeString(`${user.firstName} ${user.lastName}`),
			meetingID: scope.id,
			role,
		}).withUserId(currentUserId);

		const videoConference: VideoConferenceDO = await this.videoConferenceService.findVideoConferenceByScopeIdAndScope(
			scope.id,
			scope.scope,
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
				'Guests cannot join this conference, since the waiting room is not enabled.',
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
