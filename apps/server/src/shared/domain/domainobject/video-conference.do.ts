import { BaseWithTimestampsDO } from '@shared/domain/domainobject/base.do';
import { VideoConferenceScope } from '@shared/domain/interface/vc-scope.enum';

export class VideoConferenceOptionsDO {
	everyAttendeeJoinsMuted: boolean;

	everybodyJoinsAsModerator: boolean;

	moderatorMustApproveJoinRequests: boolean;

	constructor(options: VideoConferenceOptionsDO) {
		this.everyAttendeeJoinsMuted = options.everyAttendeeJoinsMuted;
		this.everybodyJoinsAsModerator = options.everybodyJoinsAsModerator;
		this.moderatorMustApproveJoinRequests = options.moderatorMustApproveJoinRequests;
	}
}

export class VideoConferenceDO extends BaseWithTimestampsDO {
	target: string;

	targetModel: VideoConferenceScope;

	options: VideoConferenceOptionsDO;

	constructor(domainObject: VideoConferenceDO) {
		super(domainObject);
		this.target = domainObject.target;
		this.targetModel = domainObject.targetModel;
		this.options = domainObject.options;
	}
}
