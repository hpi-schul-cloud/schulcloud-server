import { ApiProperty } from '@nestjs/swagger';
import { VideoConferenceOptionsResponse } from './video-conference-options.response';
import { VideoConferenceStateResponse } from './video-conference-state.response';

export class VideoConferenceInfoResponse {
	@ApiProperty({
		enum: VideoConferenceStateResponse,
		enumName: 'VideoConferenceStateResponse',
		description: 'The state of the video conference.',
	})
	state: VideoConferenceStateResponse;

	@ApiProperty({ description: 'The options for the video conference.' })
	options: VideoConferenceOptionsResponse;

	constructor(resp: VideoConferenceInfoResponse) {
		this.state = resp.state;
		this.options = resp.options;
	}
}
