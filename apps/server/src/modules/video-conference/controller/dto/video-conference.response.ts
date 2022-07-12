export class VideoConferenceJoinResponse {
	joinUrl: string;

	constructor(resp: VideoConferenceJoinResponse) {
		this.joinUrl = resp.joinUrl;
	}
}

export class VideoConferenceInfoResponse {
	isRunning: boolean;

	constructor(resp: VideoConferenceInfoResponse) {
		this.isRunning = resp.isRunning;
	}
}
