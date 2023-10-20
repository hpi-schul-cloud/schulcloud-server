import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class VideoConferenceCreateParams {
	@ApiProperty()
	@IsBoolean()
	@IsOptional()
	everyAttendeeJoinsMuted?: boolean;

	@ApiProperty()
	@IsBoolean()
	@IsOptional()
	everybodyJoinsAsModerator?: boolean;

	@ApiProperty()
	@IsBoolean()
	@IsOptional()
	moderatorMustApproveJoinRequests?: boolean;
}
