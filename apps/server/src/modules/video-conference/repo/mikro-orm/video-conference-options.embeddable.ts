import { Embeddable } from '@mikro-orm/core';

@Embeddable()
export class VideoConferenceOptions {
	public everyAttendeJoinsMuted: boolean;

	public everybodyJoinsAsModerator: boolean;

	public moderatorMustApproveJoinRequests: boolean;

	constructor(options: VideoConferenceOptions) {
		this.everyAttendeJoinsMuted = options.everyAttendeJoinsMuted;
		this.everybodyJoinsAsModerator = options.everybodyJoinsAsModerator;
		this.moderatorMustApproveJoinRequests = options.moderatorMustApproveJoinRequests;
	}
}
