import { Injectable } from '@nestjs/common';
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
@Injectable()
export class VideoConferenceResponseDeprecatedMapper {
	mapToBaseResponse(from: VideoConference<BBBBaseResponse>): VideoConferenceBaseResponse {
		return new VideoConferenceBaseResponse({
			state: VideoConferenceMapper.toVideoConferenceStateResponse(from.state),
			permission: from.permission,
		});
	}

	mapToJoinResponse(from: VideoConferenceJoin): VideoConferenceJoinResponse {
		return new VideoConferenceJoinResponse({
			state: VideoConferenceMapper.toVideoConferenceStateResponse(from.state),
			permission: from.permission,
			url: from.url,
		});
	}

	mapToInfoResponse(from: VideoConferenceInfo): VideoConferenceInfoResponse {
		return new VideoConferenceInfoResponse({
			state: VideoConferenceMapper.toVideoConferenceStateResponse(from.state),
			permission: from.permission,
			options: from.options,
		});
	}
}
