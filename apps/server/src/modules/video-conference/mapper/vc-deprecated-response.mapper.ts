import { BBBBaseResponse } from '../bbb/response/bbb-base.response';
import {
	DeprecatedVideoConferenceInfoResponse,
	DeprecatedVideoConferenceJoinResponse,
	VideoConferenceBaseResponse,
} from '../controller/dto/response/video-conference-deprecated.response';
import { VideoConference } from '../uc/dto/video-conference';
import { VideoConferenceInfo } from '../uc/dto/video-conference-info';
import { VideoConferenceJoin } from '../uc/dto/video-conference-join';
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

	static mapToJoinResponse(from: VideoConferenceJoin): DeprecatedVideoConferenceJoinResponse {
		return new DeprecatedVideoConferenceJoinResponse({
			state: VideoConferenceMapper.toVideoConferenceStateResponse(from.state),
			permission: from.permission,
			url: from.url,
		});
	}

	static mapToInfoResponse(from: VideoConferenceInfo): DeprecatedVideoConferenceInfoResponse {
		return new DeprecatedVideoConferenceInfoResponse({
			state: VideoConferenceMapper.toVideoConferenceStateResponse(from.state),
			permission: from.permission,
			options: from.options,
		});
	}
}
