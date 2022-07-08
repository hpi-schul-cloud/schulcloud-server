import { VideoConferenceStatus } from '@src/modules/video-conference/interface/vc-status.enum';

export class VideoConferenceBaseResponse {
	status: VideoConferenceStatus;

	messageKey: string;

	message: string;

	constructor(resp: VideoConferenceBaseResponse) {
		this.status = resp.status;
		this.messageKey = resp.message;
		this.message = resp.message;
	}
}
