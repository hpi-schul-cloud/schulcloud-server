import {
	IVideoConferenceProperties,
	TargetModels,
	VideoConference,
} from '@shared/domain/entity/video-conference.entity';
import { BaseFactory } from './base.factory';

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
