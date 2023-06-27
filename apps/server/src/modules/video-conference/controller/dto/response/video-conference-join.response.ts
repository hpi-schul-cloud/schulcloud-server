import { ApiProperty } from '@nestjs/swagger';

export class VideoConferenceJoinResponse {
	@ApiProperty({ description: 'The URL to join the video conference.' })
	url: string;

	constructor(resp: VideoConferenceJoinResponse) {
		this.url = resp.url;
	}
}
