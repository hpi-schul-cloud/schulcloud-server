import { Permission } from '@shared/domain';
import { VideoConferenceState } from './video-conference-state.enum';
import { BBBBaseResponse, BBBResponse } from '../../bbb';

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
