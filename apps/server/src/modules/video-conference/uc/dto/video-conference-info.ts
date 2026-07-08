import { VideoConference } from './video-conference';
import { type BBBMeetingInfoResponse } from '../../bbb';
import { type VideoConferenceOptions } from '../../interface';

export class VideoConferenceInfo extends VideoConference<BBBMeetingInfoResponse> {
	options: VideoConferenceOptions;

	constructor(dto: VideoConferenceInfo) {
		super(dto);
		this.options = dto.options;
	}
}
