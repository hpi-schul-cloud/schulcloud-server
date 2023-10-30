import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { VideoConferenceDO } from '@shared/domain/domainobject/video-conference.do';
import { EntityId } from '@shared/domain/types/entity-id';
import { UserService } from '@src/modules/user/service/user.service';
import { BBBService } from '../bbb/bbb.service';
import { BBBJoinConfigBuilder } from '../bbb/builder/bbb-join-config.builder';
import { BBBRole } from '../bbb/request/bbb-join.config';
import { ErrorStatus } from '../error/error-status.enum';
import { PermissionMapping } from '../mapper/video-conference.mapper';
import { VideoConferenceService } from '../service/video-conference.service';
import { ScopeRef } from './dto/scope-ref';
import { VideoConferenceJoin } from './dto/video-conference-join';
import { VideoConferenceState } from './dto/video-conference-state.enum';

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
