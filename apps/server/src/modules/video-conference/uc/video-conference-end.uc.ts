import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { EntityId } from '@shared/domain/types/entity-id';
import { UserService } from '@src/modules/user/service/user.service';
import { BBBService } from '../bbb/bbb.service';
import { BBBBaseMeetingConfig } from '../bbb/request/bbb-base-meeting.config';
import { BBBRole } from '../bbb/request/bbb-join.config';
import { BBBBaseResponse } from '../bbb/response/bbb-base.response';
import { BBBResponse } from '../bbb/response/bbb.response';
import { ErrorStatus } from '../error/error-status.enum';
import { PermissionMapping } from '../mapper/video-conference.mapper';
import { VideoConferenceService } from '../service/video-conference.service';
import { IScopeInfo } from './dto/scope-info.interface';
import { ScopeRef } from './dto/scope-ref';
import { VideoConference } from './dto/video-conference';
import { VideoConferenceState } from './dto/video-conference-state.enum';

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
