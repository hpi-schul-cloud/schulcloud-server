import { VideoConferenceDO } from '@shared/domain/domainobject';
import { VideoConferenceScope } from '@shared/domain/interface';
import { BaseFactory } from '@shared/testing';

export const videoConferenceDOFactory: BaseFactory<VideoConferenceDO, VideoConferenceDO> = BaseFactory.define<
	VideoConferenceDO,
	VideoConferenceDO
>(VideoConferenceDO, ({ sequence }) => {
	return {
		id: `vc-${sequence}`,
		target: 'course',
		targetModel: VideoConferenceScope.COURSE,
		options: {
			moderatorMustApproveJoinRequests: false,
			everybodyJoinsAsModerator: false,
			everyAttendeeJoinsMuted: true,
		},
	};
});
