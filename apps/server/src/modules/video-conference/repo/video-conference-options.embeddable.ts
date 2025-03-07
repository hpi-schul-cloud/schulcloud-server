import { Embeddable, Property } from '@mikro-orm/core';

@Embeddable()
export class VideoConferenceOptions {
	@Property()
	public everyAttendeJoinsMuted: boolean;

	@Property()
	public everybodyJoinsAsModerator: boolean;

	@Property()
	public moderatorMustApproveJoinRequests: boolean;

	constructor(options: VideoConferenceOptions) {
		this.everyAttendeJoinsMuted = options.everyAttendeJoinsMuted;
		this.everybodyJoinsAsModerator = options.everybodyJoinsAsModerator;
		this.moderatorMustApproveJoinRequests = options.moderatorMustApproveJoinRequests;
	}
}
