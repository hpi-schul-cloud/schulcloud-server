import { Embeddable, Property } from '@mikro-orm/decorators/legacy';

@Embeddable()
export class VideoConferenceOptions {
	@Property()
	everyAttendeJoinsMuted: boolean;

	@Property()
	everybodyJoinsAsModerator: boolean;

	@Property()
	moderatorMustApproveJoinRequests: boolean;

	constructor(options: VideoConferenceOptions) {
		this.everyAttendeJoinsMuted = options.everyAttendeJoinsMuted;
		this.everybodyJoinsAsModerator = options.everybodyJoinsAsModerator;
		this.moderatorMustApproveJoinRequests = options.moderatorMustApproveJoinRequests;
	}
}
