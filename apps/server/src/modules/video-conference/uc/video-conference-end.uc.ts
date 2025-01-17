import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BBBBaseMeetingConfig, BBBBaseResponse, BBBResponse, BBBRole, BBBService } from '../bbb';
import { ErrorStatus } from '../error/error-status.enum';
import { PermissionMapping } from '../mapper/video-conference.mapper';
import { VideoConferenceService } from '../service';
import { ScopeInfo, ScopeRef, VideoConference, VideoConferenceState } from './dto';
import { VideoConferenceFeatureService } from './video-conference-feature.service';

@Injectable()
export class VideoConferenceEndUc {
	constructor(
		private readonly bbbService: BBBService,
		private readonly videoConferenceService: VideoConferenceService,
		private readonly videoConferenceFeatureService: VideoConferenceFeatureService
	) {}

	public async end(currentUserId: EntityId, scope: ScopeRef): Promise<VideoConference<BBBBaseResponse>> {
		await this.videoConferenceFeatureService.checkVideoConferenceFeatureEnabled(currentUserId, scope);

		const scopeInfo: ScopeInfo = await this.videoConferenceService.getScopeInfo(currentUserId, scope.id, scope.scope);

		const bbbRole: BBBRole = await this.videoConferenceService.determineBbbRole(
			currentUserId,
			scopeInfo.scopeId,
			scope.scope
		);

		if (bbbRole !== BBBRole.MODERATOR) {
			throw new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION);
		}

		const config: BBBBaseMeetingConfig = new BBBBaseMeetingConfig({
			meetingID: scope.id,
		});

		const bbbResponse: BBBResponse<BBBBaseResponse> = await this.bbbService.end(config);

		const videoConference = new VideoConference<BBBBaseResponse>({
			state: VideoConferenceState.FINISHED,
			permission: PermissionMapping[bbbRole],
			bbbResponse,
		});
		return videoConference;
	}
}
