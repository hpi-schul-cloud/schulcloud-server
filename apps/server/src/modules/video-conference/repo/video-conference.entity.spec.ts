import { videoConferenceFactory } from '../testing';
import { VideoConferenceOptions } from './video-conference-options.embeddable';
import { VideoConferenceEntity } from './video-conference.entity';

describe('Video Conference Entity', () => {
	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new VideoConferenceEntity();
			expect(test).toThrow();
		});

		it('should create a user by passing required properties', () => {
			const vc = videoConferenceFactory.build();
			vc.options = new VideoConferenceOptions({
				everyAttendeJoinsMuted: true,
				everybodyJoinsAsModerator: true,
				moderatorMustApproveJoinRequests: true,
			});
			expect(vc instanceof VideoConferenceEntity).toEqual(true);
		});
	});
});
