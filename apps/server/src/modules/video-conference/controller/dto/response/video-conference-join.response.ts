import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VideoConferenceBaseResponse } from './video-conference.response';

export class VideoConferenceJoinResponse extends VideoConferenceBaseResponse {
	@ApiProperty({ description: 'The URL to join the video conference.', required: false })
	@IsString()
	@IsOptional()
	url?: string;

	constructor(resp: VideoConferenceJoinResponse) {
		super(resp);
		this.url = resp.url;
	}
}
