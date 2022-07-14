import { BBBBaseResponse, BBBJoinResponse } from '@src/modules/video-conference/interface/bbb-response.interface';
import { Injectable } from '@nestjs/common';
import {
	VideoConferenceBaseResponse,
	VideoConferenceInfoResponse,
	VideoConferenceJoinResponse,
} from '@src/modules/video-conference/controller/dto/video-conference.response';
import {
	VideoConferenceDTO,
	VideoConferenceInfoDTO,
	VideoConferenceJoinDTO,
} from '@src/modules/video-conference/dto/video-conference.dto';

@Injectable()
export class VideoConferenceResponseMapper {
	mapToBaseResponse(from: VideoConferenceDTO<BBBBaseResponse>): VideoConferenceBaseResponse {
		return new VideoConferenceBaseResponse({
			state: from.state,
			permission: from.permission,
		});
	}

	mapToJoinResponse(from: VideoConferenceJoinDTO): VideoConferenceJoinResponse {
		return new VideoConferenceJoinResponse({
			state: from.state,
			permission: from.permission,
			url: from.url,
		});
	}

	mapToInfoResponse(from: VideoConferenceInfoDTO): VideoConferenceInfoResponse {
		return new VideoConferenceInfoResponse({
			state: from.state,
			permission: from.permission,
			options: from.options,
		});
	}
}
