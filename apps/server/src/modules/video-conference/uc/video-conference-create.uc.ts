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
import { VideoConferenceDO } from '../domain';

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
		await this.videoConferenceFeatureService.checkVideoConferenceFeatureEnabled(currentUserId, scope);

		const videoConference = await this.videoConferenceService.createOrUpdateVideoConferenceForScopeWithOptions(
			scope.id,
			scope.scope,
			options
		);

		let bbbMeetingInfoResponse: BBBResponse<BBBMeetingInfoResponse> | undefined;
		// try and catch based on legacy behavior
		try {
			bbbMeetingInfoResponse = await this.bbbService.getMeetingInfo(
				new BBBBaseMeetingConfig({ meetingID: videoConference.target + videoConference.salt })
			);
		} catch (e) {
			bbbMeetingInfoResponse = undefined;
		}

		if (bbbMeetingInfoResponse === undefined) {
			await this.create(currentUserId, videoConference);
		}
	}

	private async create(currentUserId: EntityId, videoConference: VideoConferenceDO): Promise<void> {
		const scopeInfo: ScopeInfo = await this.videoConferenceService.getScopeInfo(
			currentUserId,
			videoConference.target,
			videoConference.targetModel
		);

		const bbbRole: BBBRole = await this.videoConferenceService.determineBbbRole(
			currentUserId,
			scopeInfo.scopeId,
			scopeInfo.scopeName
		);
		this.checkModerator(bbbRole, 'You are not allowed to start the videoconference. Ask a moderator.');

		const configBuilder: BBBCreateConfigBuilder = this.prepareBBBCreateConfigBuilder(
			videoConference.target,
			videoConference.options,
			scopeInfo,
			videoConference.salt
		);

		await this.bbbService.create(configBuilder.build());
	}

	private prepareBBBCreateConfigBuilder(
		scopeId: string,
		options: VideoConferenceOptions,
		scopeInfo: ScopeInfo,
		salt: string
	): BBBCreateConfigBuilder {
		const configBuilder: BBBCreateConfigBuilder = new BBBCreateConfigBuilder({
			name: this.videoConferenceService.sanitizeString(scopeInfo.title),
			meetingID: scopeId + salt,
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
