import {
	BBBJoinResponse,
	BBBMeetingInfoResponse,
	BBBResponse,
} from '@src/modules/video-conference/interface/bbb-response.interface';
import { Injectable } from '@nestjs/common';
import {
	VideoConferenceInfoResponse,
	VideoConferenceJoinResponse,
} from '@src/modules/video-conference/controller/dto/video-conference.response';

@Injectable()
export class VideoConferenceResponseMapper {
	mapToJoinResponse(from: BBBResponse<BBBJoinResponse>): VideoConferenceJoinResponse {
		return new VideoConferenceJoinResponse({
			joinUrl: from.response.url,
		});
	}

	mapToInfoResponse(from: BBBResponse<BBBMeetingInfoResponse>): VideoConferenceInfoResponse {
		return new VideoConferenceInfoResponse({
			isRunning: from.response.running,
		});
	}
}
