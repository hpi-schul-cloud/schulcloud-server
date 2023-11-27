import { VideoConferenceScope } from '@shared/domain/interface/video-conference-scope.enum';
import { BaseDO } from './base.do';

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

export class VideoConferenceDO extends BaseDO {
	target: string;

	targetModel: VideoConferenceScope;

	options: VideoConferenceOptionsDO;

	constructor(domainObject: VideoConferenceDO) {
		super(domainObject.id);

		this.target = domainObject.target;
		this.targetModel = domainObject.targetModel;
		this.options = domainObject.options;
	}
}
