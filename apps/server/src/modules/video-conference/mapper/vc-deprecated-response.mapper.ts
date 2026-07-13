import { type BBBBaseResponse } from '../bbb';
import {
	DeprecatedVideoConferenceInfoResponse,
	DeprecatedVideoConferenceJoinResponse,
	VideoConferenceBaseResponse,
} from '../controller/dto/response/video-conference-deprecated.response';
import { type VideoConference, type VideoConferenceInfo, type VideoConferenceJoin } from '../uc/dto';
import { VideoConferenceMapper } from './video-conference.mapper';

/**
 * @deprecated Please use the VideoConferenceResponseMapper instead.
 */
export class VideoConferenceResponseDeprecatedMapper {
	public static mapToBaseResponse(from: VideoConference<BBBBaseResponse>): VideoConferenceBaseResponse {
		return new VideoConferenceBaseResponse({
			state: VideoConferenceMapper.toVideoConferenceStateResponse(from.state),
			permission: from.permission,
		});
	}

	public static mapToJoinResponse(from: VideoConferenceJoin): DeprecatedVideoConferenceJoinResponse {
		return new DeprecatedVideoConferenceJoinResponse({
			state: VideoConferenceMapper.toVideoConferenceStateResponse(from.state),
			permission: from.permission,
			url: from.url,
		});
	}

	public static mapToInfoResponse(from: VideoConferenceInfo): DeprecatedVideoConferenceInfoResponse {
		return new DeprecatedVideoConferenceInfoResponse({
			state: VideoConferenceMapper.toVideoConferenceStateResponse(from.state),
			permission: from.permission,
			options: from.options,
		});
	}
}
