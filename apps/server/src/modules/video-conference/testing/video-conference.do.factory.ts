import { BaseFactory } from '@testing/factory/base.factory';
import { VideoConferenceDO, VideoConferenceScope } from '../domain';

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
