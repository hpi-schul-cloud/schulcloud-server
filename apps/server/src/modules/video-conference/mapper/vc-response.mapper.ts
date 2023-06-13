import { Injectable } from '@nestjs/common';
import { VideoConferenceBaseResponse } from '../controller/dto';
import { VideoConference, VideoConferenceInfo, VideoConferenceJoin } from '../uc/dto';
import { VideoConferenceInfoResponse, VideoConferenceJoinResponse } from '../controller/dto/response';
import { VideoConferenceMapper } from './video-conference.mapper';
import { BBBBaseResponse } from '../bbb';

@Injectable()
export class VideoConferenceResponseMapper {
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
