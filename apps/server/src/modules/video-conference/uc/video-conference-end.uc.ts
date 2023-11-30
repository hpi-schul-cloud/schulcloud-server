import { UserService } from '@modules/user';
import { ErrorStatus } from '@modules/video-conference/error/error-status.enum';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { BBBBaseMeetingConfig, BBBBaseResponse, BBBResponse, BBBRole, BBBService } from '../bbb';
import { PermissionMapping } from '../mapper/video-conference.mapper';
import { VideoConferenceService } from '../service';
import { ScopeInfo, ScopeRef, VideoConference, VideoConferenceState } from './dto';

@Injectable()
export class VideoConferenceEndUc {
	constructor(
		private readonly bbbService: BBBService,
		private readonly userService: UserService,
		private readonly videoConferenceService: VideoConferenceService
	) {}

	async end(currentUserId: EntityId, scope: ScopeRef): Promise<VideoConference<BBBBaseResponse>> {
		/* need to be replace with
		const [authorizableUser, scopeRessource]: [User, TeamEntity | Course] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.videoConferenceService.loadScopeRessources(scopeId, scope),
		]);
		*/
		const user: UserDO = await this.userService.findById(currentUserId);
		const userId: string = user.id as string;

		await this.videoConferenceService.throwOnFeaturesDisabled(user.schoolId);

		const scopeInfo: ScopeInfo = await this.videoConferenceService.getScopeInfo(userId, scope.id, scope.scope);

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
