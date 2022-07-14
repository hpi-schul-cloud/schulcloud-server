import {
	BBBBaseResponse,
	BBBMeetingInfoResponse,
	BBBResponse,
} from '@src/modules/video-conference/interface/bbb-response.interface';
import { VideoConferenceState } from '@src/modules/video-conference/controller/dto/vc-state.enum';
import { Permission } from '@shared/domain';
import { VideoConferenceOptions } from '@src/modules/video-conference/interface/vc-options.interface';

export interface VideoConferenceDTO<T extends BBBBaseResponse> {
	state: VideoConferenceState;

	permission: Permission;

	bbbResponse?: BBBResponse<T>;
}

export interface VideoConferenceJoinDTO {
	state: VideoConferenceState;

	permission: Permission;

	url: string;
}

export interface VideoConferenceInfoDTO extends VideoConferenceDTO<BBBMeetingInfoResponse> {
	options?: VideoConferenceOptions;
}
