import { ApiProperty } from '@nestjs/swagger';
import { VideoConferenceBaseResponse } from './video-conference.response';
import { VideoConferenceOptions } from '../../../interface';

export class VideoConferenceInfoResponse extends VideoConferenceBaseResponse {
	@ApiProperty({ description: 'The options for the video conference.', required: false })
	options?: VideoConferenceOptions;

	constructor(resp: VideoConferenceInfoResponse) {
		super(resp);
		this.options = resp.options;
	}
}
