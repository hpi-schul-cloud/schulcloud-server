import { Permission } from '@shared/domain';
import { VideoConferenceState } from './video-conference-state.enum';

export class VideoConferenceJoin {
	state: VideoConferenceState;

	permission: Permission;

	url: string;

	constructor(dto: VideoConferenceJoin) {
		this.state = dto.state;
		this.permission = dto.permission;
		this.url = dto.url;
	}
}
