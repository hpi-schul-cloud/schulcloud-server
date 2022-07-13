import { VideoConferenceState } from '@src/modules/video-conference/controller/dto/vc-state.enum';
import { Permission } from '@shared/domain';
import { VideoConferenceOptions } from '@src/modules/video-conference/interface/vc-options.interface';

export class VideoConferenceBaseResponse {
	status?: string;

	state: VideoConferenceState;

	permission: Permission;

	constructor(resp: VideoConferenceBaseResponse) {
		this.status = 'SUCCESS';
		this.state = resp.state;
		this.permission = resp.permission;
	}
}

export class VideoConferenceJoinResponse extends VideoConferenceBaseResponse {
	url?: string;

	constructor(resp: VideoConferenceJoinResponse) {
		super(resp);
		this.url = resp.url;
	}
}

export class VideoConferenceInfoResponse extends VideoConferenceBaseResponse {
	options?: VideoConferenceOptions;

	constructor(resp: VideoConferenceInfoResponse) {
		super(resp);
		this.options = resp.options;
	}
}
