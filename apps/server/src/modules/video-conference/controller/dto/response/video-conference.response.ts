import { Permission } from '@shared/domain';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VideoConferenceStateResponse } from './video-conference-state.response';

export class VideoConferenceBaseResponse {
	@ApiProperty({ description: 'The status of the video conference.', required: false })
	@IsString()
	@IsOptional()
	status?: string;

	@ApiProperty({
		enum: VideoConferenceStateResponse,
		enumName: 'VideoConferenceStateResponse',
		description: 'The state of the video conference.',
	})
	@IsEnum(VideoConferenceStateResponse)
	state: VideoConferenceStateResponse;

	@ApiProperty({ enum: Permission, description: 'The permission for the video conference.' })
	@IsEnum(Permission)
	permission: Permission;

	constructor(resp: VideoConferenceBaseResponse) {
		this.status = 'SUCCESS';
		this.state = resp.state;
		this.permission = resp.permission;
	}
}
