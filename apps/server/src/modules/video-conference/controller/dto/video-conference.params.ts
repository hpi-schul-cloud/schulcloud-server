import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { StringToBoolean } from '@shared/controller';

export class VideoConferenceCreateParams {
	@ApiProperty()
	@IsBoolean()
	@StringToBoolean()
	everyAttendeeJoinsMuted!: boolean;

	@ApiProperty()
	@IsBoolean()
	@StringToBoolean()
	everybodyJoinsAsModerator!: boolean;

	@ApiProperty()
	@IsBoolean()
	@StringToBoolean()
	moderatorMustApproveJoinRequests!: boolean;
}
