import { VideoConference, VideoConferenceInfo, VideoConferenceJoin } from '../uc/dto';
import { BBBBaseResponse } from '../bbb';
import {
	VideoConferenceBaseResponse,
	VideoConferenceInfoResponse,
	VideoConferenceJoinResponse,
} from '../controller/dto/response/video-conference-deprecated.response';
import { VideoConferenceMapper } from './video-conference.mapper';

/**
 * @deprecated Please use the VideoConferenceResponseMapper instead.
 */
export class VideoConferenceResponseDeprecatedMapper {
	static mapToBaseResponse(from: VideoConference<BBBBaseResponse>): VideoConferenceBaseResponse {
		return new VideoConferenceBaseResponse({
			state: VideoConferenceMapper.toVideoConferenceStateResponse(from.state),
			permission: from.permission,
		});
	}

	static mapToJoinResponse(from: VideoConferenceJoin): VideoConferenceJoinResponse {
		return new VideoConferenceJoinResponse({
			state: VideoConferenceMapper.toVideoConferenceStateResponse(from.state),
			permission: from.permission,
			url: from.url,
		});
	}

	static mapToInfoResponse(from: VideoConferenceInfo): VideoConferenceInfoResponse {
		return new VideoConferenceInfoResponse({
			state: VideoConferenceMapper.toVideoConferenceStateResponse(from.state),
			permission: from.permission,
			options: from.options,
		});
	}
}
