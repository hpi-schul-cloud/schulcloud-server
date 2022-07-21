import {
	BBBBaseResponse,
	BBBMeetingInfoResponse,
	BBBResponse,
} from '@src/modules/video-conference/interface/bbb-response.interface';
import { VideoConferenceState } from '@src/modules/video-conference/controller/dto/vc-state.enum';
import { Permission } from '@shared/domain';
import { VideoConferenceOptions } from '@src/modules/video-conference/interface/vc-options.interface';

export class VideoConferenceDTO<T extends BBBBaseResponse> {
	state: VideoConferenceState;

	permission: Permission;

	bbbResponse?: BBBResponse<T>;

	constructor(dto: VideoConferenceDTO<T>) {
		this.state = dto.state;
		this.bbbResponse = dto.bbbResponse;
		this.permission = dto.permission;
	}
}

export class VideoConferenceJoinDTO {
	state: VideoConferenceState;

	permission: Permission;

	url: string;

	constructor(dto: VideoConferenceJoinDTO) {
		this.state = dto.state;
		this.permission = dto.permission;
		this.url = dto.url;
	}
}

export class VideoConferenceInfoDTO extends VideoConferenceDTO<BBBMeetingInfoResponse> {
	constructor(dto: VideoConferenceInfoDTO) {
		super(dto);
		this.options = dto.options;
	}

	options: VideoConferenceOptions;
}
