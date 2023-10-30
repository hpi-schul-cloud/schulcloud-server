import { ApiPropertyOptional } from '@nestjs/swagger';
import { defaultVideoConferenceOptions } from '@src/modules/video-conference/interface/video-conference-options.interface';
import { IsBoolean, IsOptional, IsUrl } from 'class-validator';

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

	@ApiPropertyOptional({
		description:
			'The URL that the BigBlueButton client will go to after users click the OK button on the ‘You have been logged out’ or ’This session was ended’ message. Has to be a URL from the same domain that the conference is started from.',
	})
	@IsUrl({ require_tld: false })
	@IsOptional()
	logoutUrl?: string;
}
