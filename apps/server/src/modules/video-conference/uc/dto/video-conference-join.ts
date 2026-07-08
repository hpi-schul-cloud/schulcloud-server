import { type Permission } from '@shared/domain/interface';
import { type VideoConferenceState } from './video-conference-state.enum';

export class VideoConferenceJoin {
	public state: VideoConferenceState;

	public permission: Permission;

	public url: string;

	constructor(dto: VideoConferenceJoin) {
		this.state = dto.state;
		this.permission = dto.permission;
		this.url = dto.url;
	}
}
