import { BaseFactory } from '@testing/factory/base.factory';
import { VideoConferenceEntity, VideoConferenceProps, VideoConferenceTargetModels } from '../repo';

export const videoConferenceFactory = BaseFactory.define<VideoConferenceEntity, VideoConferenceProps>(
	VideoConferenceEntity,
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
