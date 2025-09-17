import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import {
	BBBBaseMeetingConfig,
	BBBCreateConfigBuilder,
	BBBMeetingInfoResponse,
	BBBResponse,
	BBBRole,
	BBBService,
	GuestPolicy,
} from '../bbb';
import { ErrorStatus } from '../error/error-status.enum';
import { VideoConferenceOptions } from '../interface';
import { VideoConferenceService } from '../service';
import { ScopeInfo, ScopeRef } from './dto';
import { VideoConferenceFeatureService } from './video-conference-feature.service';

@Injectable()
export class VideoConferenceCreateUc {
	constructor(
		private readonly bbbService: BBBService,
		private readonly videoConferenceService: VideoConferenceService,
		private readonly videoConferenceFeatureService: VideoConferenceFeatureService
	) {}

	public async createIfNotRunning(
		currentUserId: EntityId,
		scope: ScopeRef,
		options: VideoConferenceOptions
	): Promise<void> {
		let bbbMeetingInfoResponse: BBBResponse<BBBMeetingInfoResponse> | undefined;
		// try and catch based on legacy behavior
		try {
			const videoConference = await this.videoConferenceService.findVideoConferenceByScopeIdAndScope(
				scope.id,
				scope.scope
			);
			bbbMeetingInfoResponse = await this.bbbService.getMeetingInfo(
				new BBBBaseMeetingConfig({ meetingID: scope.id + videoConference.salt })
			);
		} catch (e) {
			bbbMeetingInfoResponse = undefined;
		}

		if (bbbMeetingInfoResponse === undefined) {
			await this.create(currentUserId, scope, options);
		}
	}

	private async create(currentUserId: EntityId, scope: ScopeRef, options: VideoConferenceOptions): Promise<void> {
		await this.videoConferenceFeatureService.checkVideoConferenceFeatureEnabled(currentUserId, scope);

		const scopeInfo: ScopeInfo = await this.videoConferenceService.getScopeInfo(currentUserId, scope.id, scope.scope);

		const bbbRole: BBBRole = await this.videoConferenceService.determineBbbRole(
			currentUserId,
			scopeInfo.scopeId,
			scope.scope
		);
		this.checkModerator(bbbRole, 'You are not allowed to start the videoconference. Ask a moderator.');

		const vcDo = await this.videoConferenceService.createOrUpdateVideoConferenceForScopeWithOptions(
			scope.id,
			scope.scope,
			options
		);

		const configBuilder: BBBCreateConfigBuilder = this.prepareBBBCreateConfigBuilder(
			scope,
			options,
			scopeInfo,
			vcDo.salt
		);

		await this.bbbService.create(configBuilder.build());
	}

	private prepareBBBCreateConfigBuilder(
		scope: ScopeRef,
		options: VideoConferenceOptions,
		scopeInfo: ScopeInfo,
		salt: string
	): BBBCreateConfigBuilder {
		const configBuilder: BBBCreateConfigBuilder = new BBBCreateConfigBuilder({
			name: this.videoConferenceService.sanitizeString(scopeInfo.title),
			meetingID: scope.id + salt,
		}).withLogoutUrl(options.logoutUrl ?? scopeInfo.logoutUrl);

		if (options.moderatorMustApproveJoinRequests) {
			configBuilder.withGuestPolicy(GuestPolicy.ASK_MODERATOR);
		}

		if (options.everyAttendeeJoinsMuted) {
			configBuilder.withMuteOnStart(true);
		}

		return configBuilder;
	}

	private checkModerator(role: BBBRole, errorMessage: string): void {
		if (role !== BBBRole.MODERATOR) {
			throw new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION, errorMessage);
		}
	}
}
