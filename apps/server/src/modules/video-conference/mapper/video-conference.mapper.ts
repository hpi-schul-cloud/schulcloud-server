import { Permission } from '@shared/domain/interface/permission.enum';
import { VideoConferenceScope } from '@shared/domain/interface/video-conference-scope.enum';
import { AuthorizableReferenceType } from '@src/modules/authorization/types/allowed-authorization-object-type.enum';
import { BBBRole } from '../bbb/request/bbb-join.config';
import { VideoConferenceCreateParams } from '../controller/dto/request/video-conference-create.params';
import { VideoConferenceInfoResponse } from '../controller/dto/response/video-conference-info.response';
import { VideoConferenceJoinResponse } from '../controller/dto/response/video-conference-join.response';
import { VideoConferenceOptionsResponse } from '../controller/dto/response/video-conference-options.response';
import { VideoConferenceStateResponse } from '../controller/dto/response/video-conference-state.response';
import { defaultVideoConferenceOptions, VideoConferenceOptions } from '../interface/video-conference-options.interface';
import { VideoConferenceInfo } from '../uc/dto/video-conference-info';
import { VideoConferenceJoin } from '../uc/dto/video-conference-join';
import { VideoConferenceState } from '../uc/dto/video-conference-state.enum';

export const PermissionMapping = {
	[BBBRole.MODERATOR]: Permission.START_MEETING,
	[BBBRole.VIEWER]: Permission.JOIN_MEETING,
};

export const PermissionScopeMapping = {
	[VideoConferenceScope.COURSE]: AuthorizableReferenceType.Course,
	[VideoConferenceScope.EVENT]: AuthorizableReferenceType.Team,
};

const stateMapping = {
	[VideoConferenceState.NOT_STARTED]: VideoConferenceStateResponse.NOT_STARTED,
	[VideoConferenceState.RUNNING]: VideoConferenceStateResponse.RUNNING,
	[VideoConferenceState.FINISHED]: VideoConferenceStateResponse.FINISHED,
};

export class VideoConferenceMapper {
	static toVideoConferenceInfoResponse(videoConferenceInfo: VideoConferenceInfo): VideoConferenceInfoResponse {
		return new VideoConferenceInfoResponse({
			state: this.toVideoConferenceStateResponse(videoConferenceInfo.state),
			options: new VideoConferenceOptionsResponse(videoConferenceInfo.options),
		});
	}

	static toVideoConferenceJoinResponse(videoConferenceJoin: VideoConferenceJoin): VideoConferenceJoinResponse {
		return new VideoConferenceJoinResponse({
			url: videoConferenceJoin.url,
		});
	}

	static toVideoConferenceStateResponse(state: VideoConferenceState): VideoConferenceStateResponse {
		return stateMapping[state];
	}

	static toVideoConferenceOptions(params: VideoConferenceCreateParams): VideoConferenceOptions {
		return {
			everyAttendeeJoinsMuted: params.everyAttendeeJoinsMuted ?? defaultVideoConferenceOptions.everyAttendeeJoinsMuted,
			everybodyJoinsAsModerator:
				params.everybodyJoinsAsModerator ?? defaultVideoConferenceOptions.everybodyJoinsAsModerator,
			moderatorMustApproveJoinRequests:
				params.moderatorMustApproveJoinRequests ?? defaultVideoConferenceOptions.moderatorMustApproveJoinRequests,
			logoutUrl: params.logoutUrl,
		};
	}
}
