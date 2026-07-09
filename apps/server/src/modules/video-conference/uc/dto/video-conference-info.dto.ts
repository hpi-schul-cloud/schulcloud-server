import { type BBBMeetingInfoResponse } from '../../bbb';
import { type VideoConferenceOptions } from '../../interface';
import { VideoConference } from './video-conference.response';

export class VideoConferenceInfo extends VideoConference<BBBMeetingInfoResponse> {
	options: VideoConferenceOptions;

	constructor(dto: VideoConferenceInfo) {
		super(dto);
		this.options = dto.options;
	}
}
