import { VideoConferenceState } from '@src/modules/video-conference/controller/dto/vc-state.enum';
import { Permission } from '@shared/domain';

export class VideoConferenceBaseResponse {
	status?: string;

	state: VideoConferenceState;

	permission: Permission.START_MEETING | Permission.JOIN_MEETING;

	constructor(resp: VideoConferenceBaseResponse) {
		this.status = 'SUCCESS';
		this.state = resp.state;
		this.permission = resp.permission;
	}
}

export class VideoConferenceJoinResponse extends VideoConferenceBaseResponse {
	url: string;

	constructor(resp: VideoConferenceJoinResponse) {
		super(resp);
		this.url = resp.url;
	}
}

export class VideoConferenceInfoResponse extends VideoConferenceBaseResponse {
	options: {
		everyAttendeeJoinsMuted: boolean;

		everybodyJoinsAsModerator: boolean;

		moderatorMustApproveJoinRequests: boolean;
	}; // TODO another interface?

	constructor(resp: VideoConferenceInfoResponse) {
		super(resp);
		this.options = resp.options;
	}
}
