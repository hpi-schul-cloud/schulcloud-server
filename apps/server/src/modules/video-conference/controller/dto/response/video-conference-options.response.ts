import { ApiProperty } from '@nestjs/swagger';

export class VideoConferenceOptionsResponse {
	@ApiProperty({
		description: 'Every attendee joins muted',
		example: false,
	})
	everyAttendeeJoinsMuted: boolean;

	@ApiProperty({
		description: 'Every attendee joins as a moderator',
		example: false,
	})
	everybodyJoinsAsModerator: boolean;

	@ApiProperty({
		description: 'Moderator must approve join requests',
		example: true,
	})
	moderatorMustApproveJoinRequests: boolean;

	constructor(resp: VideoConferenceOptionsResponse) {
		this.everyAttendeeJoinsMuted = resp.everyAttendeeJoinsMuted;
		this.everybodyJoinsAsModerator = resp.everybodyJoinsAsModerator;
		this.moderatorMustApproveJoinRequests = resp.moderatorMustApproveJoinRequests;
	}
}
