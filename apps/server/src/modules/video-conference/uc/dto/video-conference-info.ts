import { VideoConference } from './video-conference';
import { BBBMeetingInfoResponse } from '../../bbb';
import { VideoConferenceOptions } from '../../interface';

export class VideoConferenceInfo extends VideoConference<BBBMeetingInfoResponse> {
	constructor(dto: VideoConferenceInfo) {
		super(dto);
		this.options = dto.options;
	}

	options: VideoConferenceOptions;
}
