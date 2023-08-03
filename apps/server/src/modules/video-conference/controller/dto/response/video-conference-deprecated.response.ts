import { Permission } from '@shared/domain';
import { VideoConferenceStateResponse } from './video-conference-state.response';

/**
 * @deprecated Please use new video conference response classes
 */
export class VideoConferenceBaseResponse {
	status?: string;

	state: VideoConferenceStateResponse;

	permission: Permission;

	constructor(resp: VideoConferenceBaseResponse) {
		this.status = 'SUCCESS';
		this.state = resp.state;
		this.permission = resp.permission;
	}
}

/**
 * @deprecated Please use new video conference response classes
 */
export class DeprecatedVideoConferenceJoinResponse extends VideoConferenceBaseResponse {
	url?: string;

	constructor(resp: DeprecatedVideoConferenceJoinResponse) {
		super(resp);
		this.url = resp.url;
	}
}

/**
 * @deprecated Please use new video conference response classes
 */
export class DeprecatedVideoConferenceInfoResponse extends VideoConferenceBaseResponse {
	options?: {
		everyAttendeeJoinsMuted: boolean;

		everybodyJoinsAsModerator: boolean;

		moderatorMustApproveJoinRequests: boolean;
	};

	constructor(resp: DeprecatedVideoConferenceInfoResponse) {
		super(resp);
		this.options = resp.options;
	}
}
