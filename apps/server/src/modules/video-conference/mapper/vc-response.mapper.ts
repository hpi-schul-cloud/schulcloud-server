import {
	BBBBaseResponse,
	BBBCreateResponse,
	BBBJoinResponse,
	BBBMeetingInfoResponse,
	BBBResponse,
} from '@src/modules/video-conference/interface/bbb-response.interface';
import { VideoConferenceCreateResponse } from '@src/modules/video-conference/controller/dto/vc-create.response';
import { VideoConferenceJoinResponse } from '@src/modules/video-conference/controller/dto/vc-join.response';
import { VideoConferenceInfoResponse } from '@src/modules/video-conference/controller/dto/vc-info.response';
import { VideoConferenceBaseResponse } from '../controller/dto/vc-base.response';

export class VideoConferenceResponseMapper {
	static mapToCreateResponse(from: BBBResponse<BBBCreateResponse>): VideoConferenceCreateResponse {
		return new VideoConferenceCreateResponse();
	}

	static mapToJoinResponse(from: BBBResponse<BBBJoinResponse>): VideoConferenceJoinResponse {
		return new VideoConferenceJoinResponse();
	}

	static mapToInfoResponse(from: BBBResponse<BBBMeetingInfoResponse>): VideoConferenceInfoResponse {
		return new VideoConferenceInfoResponse();
	}

	static mapToBaseResponse(from: BBBResponse<BBBBaseResponse>): VideoConferenceBaseResponse {
		return new VideoConferenceBaseResponse();
	}
}
