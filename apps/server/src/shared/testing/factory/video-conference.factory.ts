import {
	IVideoConferenceProperties,
	TargetModels,
	VideoConference,
} from '@shared/domain/entity/video-conference.entity';
import { BaseEntityTestFactory } from './base-entity-test.factory';

export const videoConferenceFactory = BaseEntityTestFactory.define<VideoConference, IVideoConferenceProperties>(
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
