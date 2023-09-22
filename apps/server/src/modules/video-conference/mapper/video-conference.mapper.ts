import { Permission } from '@shared/domain';
import { BBBRole } from '../bbb';
import {
	VideoConferenceCreateParams,
	VideoConferenceInfoResponse,
	VideoConferenceJoinResponse,
	VideoConferenceStateResponse,
} from '../controller/dto';
import { VideoConferenceOptionsResponse } from '../controller/dto/response/video-conference-options.response';
import { defaultVideoConferenceOptions, VideoConferenceOptions } from '../interface';
import { VideoConferenceInfo, VideoConferenceJoin, VideoConferenceState } from '../uc/dto';

export const PermissionMapping = {
	[BBBRole.MODERATOR]: Permission.START_MEETING,
	[BBBRole.VIEWER]: Permission.JOIN_MEETING,
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
