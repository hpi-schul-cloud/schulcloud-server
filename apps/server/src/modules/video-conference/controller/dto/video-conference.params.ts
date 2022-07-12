import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class VideoConferenceCreateParams {
	@ApiProperty()
	@IsBoolean()
	everyAttendeeJoinsMuted!: boolean;

	@ApiProperty()
	@IsBoolean()
	everybodyJoinsAsModerator!: boolean;

	@ApiProperty()
	@IsBoolean()
	moderatorMustApproveJoinRequests!: boolean;
}
