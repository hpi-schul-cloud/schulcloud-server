import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId, UserDO } from '@shared/domain';
import { ErrorStatus } from '@src/modules/video-conference/error/error-status.enum';
import { UserService } from '@src/modules/user';
import { BBBBaseMeetingConfig, BBBBaseResponse, BBBResponse, BBBRole, BBBService } from '../bbb';
import { IScopeInfo, ScopeRef, VideoConference, VideoConferenceState } from './dto';
import { VideoConferenceService } from '../service';
import { PermissionMapping } from '../mapper/video-conference.mapper';

@Injectable()
export class VideoConferenceEndUc {
	constructor(
		private readonly bbbService: BBBService,
		private readonly userService: UserService,
		private readonly videoConferenceService: VideoConferenceService
	) {}

	async end(currentUserId: EntityId, scope: ScopeRef): Promise<VideoConference<BBBBaseResponse>> {
		const user: UserDO = await this.userService.findById(currentUserId);
		const userId: string = user.id as string;

		await this.videoConferenceService.throwOnFeaturesDisabled(user.schoolId);

		const scopeInfo: IScopeInfo = await this.videoConferenceService.getScopeInfo(userId, scope.id, scope.scope);

		const bbbRole: BBBRole = await this.videoConferenceService.determineBbbRole(userId, scopeInfo.scopeId, scope.scope);

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
