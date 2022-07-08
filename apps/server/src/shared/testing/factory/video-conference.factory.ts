import { BaseFactory } from '@shared/testing/factory/base.factory';
import { Board, BoardProps, IUserProperties, RoleName, User } from '@shared/domain';
import { courseFactory, roleFactory } from '@shared/testing';
import {
	IVideoConferenceProperties,
	TargetModels,
	VideoConference,
} from '@shared/domain/entity/video-conference.entity';
import { DeepPartial } from 'fishery';

export const videoConferenceFactory = BaseFactory.define<VideoConference, IVideoConferenceProperties>(
	VideoConference,
	({ sequence }) => {
		return {
			target: `${sequence}`,
			targetModel: TargetModels.COURSES,
			options: {
				moderatorMustApproveJoinRequests: false,
				everyAttendeeJoinsMuted: false,
				everybodyJoinsAsModerator: false,
			},
		};
	}
);
