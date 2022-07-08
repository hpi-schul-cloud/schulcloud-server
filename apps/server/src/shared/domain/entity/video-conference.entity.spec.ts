import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing';
import { VideoConference } from '@shared/domain/entity/video-conference.entity';
import { videoConferenceFactory } from '@shared/testing/factory/video-conference.factory';

describe('Video Conference Entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new VideoConference();
			expect(test).toThrow();
		});

		it('should create a user by passing required properties', () => {
			const vc = videoConferenceFactory.build();
			expect(vc instanceof VideoConference).toEqual(true);
		});
	});
});
