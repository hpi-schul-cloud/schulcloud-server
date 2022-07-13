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
import { VideoConferenceState } from '@src/modules/video-conference/controller/dto/vc-state.enum';
import {BBBRole} from "@src/modules/video-conference/config/bbb-join.config";

@Injectable()
export class VideoConferenceResponseMapper {
	mapToJoinResponse(from: BBBResponse<BBBJoinResponse>, bbbRole: BBBRole): VideoConferenceJoinResponse {
		return new VideoConferenceJoinResponse({
			state: VideoConferenceState.RUNNING,
			permission: from
			url: from.response.url,
		});
	}

	mapToInfoResponse(from: BBBResponse<BBBMeetingInfoResponse>): VideoConferenceInfoResponse {
		return new VideoConferenceInfoResponse({
			isRunning: from.response.running,
		});
	}
}
