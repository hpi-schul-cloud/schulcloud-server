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

export class VideoConferenceCreateResponse extends VideoConferenceBaseResponse {
	// eslint-disable-next-line @typescript-eslint/no-useless-constructor
	constructor(resp: VideoConferenceCreateResponse) {
		super(resp);
	}
}

export class VideoConferenceJoinResponse extends VideoConferenceBaseResponse {
	// eslint-disable-next-line @typescript-eslint/no-useless-constructor
	constructor(resp: VideoConferenceJoinResponse) {
		super(resp);
	}
}

export class VideoConferenceInfoResponse extends VideoConferenceBaseResponse {
	// eslint-disable-next-line @typescript-eslint/no-useless-constructor
	constructor(resp: VideoConferenceInfoResponse) {
		super(resp);
	}
}
