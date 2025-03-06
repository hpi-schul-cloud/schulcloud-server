import { BaseFactory } from '@testing/factory/base.factory';
import { VideoConference, VideoConferenceProps, VideoConferenceTargetModels } from '../repo';

export const videoConferenceFactory = BaseFactory.define<VideoConference, VideoConferenceProps>(
	VideoConference,
	({ sequence }) => {
		return {
			target: `${sequence}`,
			targetModel: VideoConferenceTargetModels.COURSES,
			options: {
				moderatorMustApproveJoinRequests: false,
				everyAttendeJoinsMuted: false,
				everybodyJoinsAsModerator: false,
			},
		};
	}
);
