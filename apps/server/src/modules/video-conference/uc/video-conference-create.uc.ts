import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { EntityId } from '@shared/domain/types/entity-id';
import { UserService } from '@src/modules/user/service/user.service';
import { BBBService } from '../bbb/bbb.service';
import { BBBCreateConfigBuilder } from '../bbb/builder/bbb-create-config.builder';
import { BBBBaseMeetingConfig } from '../bbb/request/bbb-base-meeting.config';
import { GuestPolicy } from '../bbb/request/bbb-create.config';
import { BBBRole } from '../bbb/request/bbb-join.config';
import { BBBMeetingInfoResponse } from '../bbb/response/bbb-meeting-info.response';
import { BBBResponse } from '../bbb/response/bbb.response';
import { ErrorStatus } from '../error/error-status.enum';
import { VideoConferenceOptions } from '../interface/video-conference-options.interface';
import { VideoConferenceService } from '../service/video-conference.service';
import { IScopeInfo } from './dto/scope-info.interface';
import { ScopeRef } from './dto/scope-ref';

@Injectable()
export class VideoConferenceCreateUc {
	constructor(
		private readonly bbbService: BBBService,
		private readonly userService: UserService,
		private readonly videoConferenceService: VideoConferenceService
	) {}

	async createIfNotRunning(currentUserId: EntityId, scope: ScopeRef, options: VideoConferenceOptions): Promise<void> {
		let bbbMeetingInfoResponse: BBBResponse<BBBMeetingInfoResponse> | undefined;
		// try and catch based on legacy behavior
		try {
			bbbMeetingInfoResponse = await this.bbbService.getMeetingInfo(new BBBBaseMeetingConfig({ meetingID: scope.id }));
		} catch (e) {
			bbbMeetingInfoResponse = undefined;
		}

		if (bbbMeetingInfoResponse === undefined) {
			await this.create(currentUserId, scope, options);
		}
	}

	private async create(currentUserId: EntityId, scope: ScopeRef, options: VideoConferenceOptions): Promise<void> {
		const user: UserDO = await this.userService.findById(currentUserId);

		await this.verifyFeaturesEnabled(user.schoolId);

		const scopeInfo: IScopeInfo = await this.videoConferenceService.getScopeInfo(currentUserId, scope.id, scope.scope);

		const bbbRole: BBBRole = await this.videoConferenceService.determineBbbRole(
			currentUserId,
			scopeInfo.scopeId,
			scope.scope
		);
		this.throwIfNotModerator(bbbRole, 'You are not allowed to start the videoconference. Ask a moderator.');

		await this.videoConferenceService.createOrUpdateVideoConferenceForScopeWithOptions(scope.id, scope.scope, options);

		const configBuilder: BBBCreateConfigBuilder = this.prepareBBBCreateConfigBuilder(scope, options, scopeInfo);

		await this.bbbService.create(configBuilder.build());
	}

	private prepareBBBCreateConfigBuilder(
		scope: ScopeRef,
		options: VideoConferenceOptions,
		scopeInfo: IScopeInfo
	): BBBCreateConfigBuilder {
		const configBuilder: BBBCreateConfigBuilder = new BBBCreateConfigBuilder({
			name: this.videoConferenceService.sanitizeString(scopeInfo.title),
			meetingID: scope.id,
		}).withLogoutUrl(options.logoutUrl ?? scopeInfo.logoutUrl);

		if (options.moderatorMustApproveJoinRequests) {
			configBuilder.withGuestPolicy(GuestPolicy.ASK_MODERATOR);
		}

		if (options.everyAttendeeJoinsMuted) {
			configBuilder.withMuteOnStart(true);
		}

		return configBuilder;
	}

	private async verifyFeaturesEnabled(schoolId: string): Promise<void> {
		await this.videoConferenceService.throwOnFeaturesDisabled(schoolId);
	}

	private throwIfNotModerator(role: BBBRole, errorMessage: string) {
		if (role !== BBBRole.MODERATOR) {
			throw new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION, errorMessage);
		}
	}
}
