import { type Permission } from '@shared/domain/interface';
import { type BBBBaseResponse, type BBBResponse } from '../../bbb';
import { type VideoConferenceState } from './video-conference-state.enum';

export class VideoConference<T extends BBBBaseResponse> {
	state: VideoConferenceState;

	permission: Permission;

	bbbResponse?: BBBResponse<T>;

	constructor(dto: VideoConference<T>) {
		this.state = dto.state;
		this.bbbResponse = dto.bbbResponse;
		this.permission = dto.permission;
	}
}
