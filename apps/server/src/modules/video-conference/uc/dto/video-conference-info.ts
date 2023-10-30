import { BBBMeetingInfoResponse } from '../../bbb/response/bbb-meeting-info.response';
import { VideoConferenceOptions } from '../../interface/video-conference-options.interface';
import { VideoConference } from './video-conference';

export class VideoConferenceInfo extends VideoConference<BBBMeetingInfoResponse> {
	options: VideoConferenceOptions;

	constructor(dto: VideoConferenceInfo) {
		super(dto);
		this.options = dto.options;
	}
}
