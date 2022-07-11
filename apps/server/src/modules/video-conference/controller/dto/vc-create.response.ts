import { VideoConferenceBaseResponse } from '@src/modules/video-conference/controller/dto/vc-base.response';
import { VideoConferenceDO } from '@shared/domain';

export class VideoConferenceCreateResponse extends VideoConferenceBaseResponse {
	videoConferenceDO: VideoConferenceDO;

	constructor(resp: VideoConferenceCreateResponse) {
		super(resp);
		this.videoConferenceDO = resp.videoConferenceDO;
	}
}
