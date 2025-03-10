export class VideoConferenceOptionsDO {
	public everyAttendeeJoinsMuted: boolean;

	public everybodyJoinsAsModerator: boolean;

	public moderatorMustApproveJoinRequests: boolean;

	constructor(options: VideoConferenceOptionsDO) {
		this.everyAttendeeJoinsMuted = options.everyAttendeeJoinsMuted;
		this.everybodyJoinsAsModerator = options.everybodyJoinsAsModerator;
		this.moderatorMustApproveJoinRequests = options.moderatorMustApproveJoinRequests;
	}
}
