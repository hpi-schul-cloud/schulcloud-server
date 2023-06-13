import { Permission, VideoConferenceScope } from '@shared/domain';
import { AuthorizableReferenceType } from '@src/modules/authorization';
import { VideoConference, VideoConferenceBaseResponse, VideoConferenceCreateParams } from '../controller/dto';
import {
	VideoConferenceInfoResponse,
	VideoConferenceJoinResponse,
	VideoConferenceStateResponse,
} from '../controller/dto/response';
import { VideoConferenceInfo, VideoConferenceJoin, VideoConferenceState } from '../uc/dto';
import { BBBBaseResponse, BBBMeetingInfoResponse, BBBRole } from '../bbb';
import { VideoConferenceOptions } from '../interface';

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
	static toVideoConferenceBaseResponse(
		videoConference: VideoConference<BBBMeetingInfoResponse | BBBBaseResponse>
	): VideoConferenceBaseResponse {
		return new VideoConferenceBaseResponse({
			state: this.toVideoConferenceStateResponse(videoConference.state),
			permission: videoConference.permission,
		});
	}

	static toVideoConferenceInfoResponse(videoConferenceInfo: VideoConferenceInfo): VideoConferenceInfoResponse {
		const baseResponse = this.toVideoConferenceBaseResponse(videoConferenceInfo);
		return new VideoConferenceInfoResponse({
			...baseResponse,
			options: videoConferenceInfo.options,
		});
	}

	static toVideoConferenceJoinResponse(videoConferenceJoin: VideoConferenceJoin): VideoConferenceJoinResponse {
		const baseResponse = this.toVideoConferenceBaseResponse(videoConferenceJoin);
		return new VideoConferenceJoinResponse({
			...baseResponse,
			url: videoConferenceJoin.url,
		});
	}

	static toVideoConferenceStateResponse(state: VideoConferenceState): VideoConferenceStateResponse {
		return stateMapping[state];
	}

	static toVideoConferenceOptions(params: VideoConferenceCreateParams): VideoConferenceOptions {
		return {
			everyAttendeeJoinsMuted: params.everyAttendeeJoinsMuted !== undefined ? params.everyAttendeeJoinsMuted : false,
			everybodyJoinsAsModerator:
				params.everybodyJoinsAsModerator !== undefined ? params.everybodyJoinsAsModerator : false,
			moderatorMustApproveJoinRequests:
				params.moderatorMustApproveJoinRequests !== undefined ? params.moderatorMustApproveJoinRequests : false,
		};
	}
}
