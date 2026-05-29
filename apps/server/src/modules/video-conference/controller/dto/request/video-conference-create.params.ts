import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { defaultVideoConferenceOptions } from '../../../interface';

export class VideoConferenceCreateParams {
	@ApiPropertyOptional({ default: defaultVideoConferenceOptions.everyAttendeeJoinsMuted })
	@IsBoolean()
	@IsOptional()
	everyAttendeeJoinsMuted?: boolean;

	@ApiPropertyOptional({ default: defaultVideoConferenceOptions.everybodyJoinsAsModerator })
	@IsBoolean()
	@IsOptional()
	everybodyJoinsAsModerator?: boolean;

	@ApiPropertyOptional({ default: defaultVideoConferenceOptions.moderatorMustApproveJoinRequests })
	@IsBoolean()
	@IsOptional()
	moderatorMustApproveJoinRequests?: boolean;
}
