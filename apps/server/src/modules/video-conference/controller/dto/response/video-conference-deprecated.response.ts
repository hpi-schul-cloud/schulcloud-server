import { Permission } from '@shared/domain';
import { VideoConferenceOptions } from '../../../interface';
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
export class VideoConferenceJoinResponse extends VideoConferenceBaseResponse {
	url?: string;

	constructor(resp: VideoConferenceJoinResponse) {
		super(resp);
		this.url = resp.url;
	}
}

/**
 * @deprecated Please use new video conference response classes
 */
export class VideoConferenceInfoResponse extends VideoConferenceBaseResponse {
	options?: VideoConferenceOptions;

	constructor(resp: VideoConferenceInfoResponse) {
		super(resp);
		this.options = resp.options;
	}
}
