import { videoConferenceFactory } from '@shared/testing/factory/video-conference.factory';
import { setupEntities } from '@shared/testing/setup-entities';
import { VideoConference, VideoConferenceOptions } from './video-conference.entity';

describe('Video Conference Entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new VideoConference();
			expect(test).toThrow();
		});

		it('should create a user by passing required properties', () => {
			const vc = videoConferenceFactory.build();
			vc.options = new VideoConferenceOptions({
				everyAttendeJoinsMuted: true,
				everybodyJoinsAsModerator: true,
				moderatorMustApproveJoinRequests: true,
			});
			expect(vc instanceof VideoConference).toEqual(true);
		});
	});
});
