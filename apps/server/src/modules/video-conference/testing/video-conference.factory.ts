import { BaseFactory } from '@testing/factory/base.factory';
import { VideoConferenceEntity, VideoConferenceProps, VideoConferenceTargetModels } from '../repo';

export const videoConferenceFactory = BaseFactory.define<VideoConferenceEntity, VideoConferenceProps>(
	VideoConferenceEntity,
	({ sequence }) => {
		return {
			target: `${sequence}`,
			targetModel: VideoConferenceTargetModels.COURSES,
			salt: 'fixed-salt-for-testing',
			options: {
				moderatorMustApproveJoinRequests: false,
				everyAttendeJoinsMuted: false,
				everybodyJoinsAsModerator: false,
			},
		};
	}
);
