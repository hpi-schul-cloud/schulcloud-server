import { Permission } from '@shared/domain/interface/permission.enum';
import { BBBBaseResponse } from '../../bbb/response/bbb-base.response';
import { BBBResponse } from '../../bbb/response/bbb.response';
import { VideoConferenceState } from './video-conference-state.enum';

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
