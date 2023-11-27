import { BaseFactory } from '@shared/testing/factory/base.factory';
import {
	IVideoConferenceProperties,
	TargetModels,
	VideoConference,
} from '@shared/domain/entity/video-conference.entity';

export const videoConferenceFactory = BaseFactory.define<VideoConference, IVideoConferenceProperties>(
	VideoConference,
	({ sequence }) => {
		return {
			target: `${sequence}`,
			targetModel: TargetModels.COURSES,
			options: {
				moderatorMustApproveJoinRequests: false,
				everyAttendeJoinsMuted: false,
				everybodyJoinsAsModerator: false,
			},
		};
	}
);
