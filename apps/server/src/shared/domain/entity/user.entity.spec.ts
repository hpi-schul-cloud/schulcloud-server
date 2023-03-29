import { setupEntities, userFactory } from '@shared/testing';
import { User } from './user.entity';

describe('User Entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new User();
			expect(test).toThrow();
		});

		it('should create a user by passing required properties', () => {
			const user = userFactory.build();
			expect(user instanceof User).toEqual(true);
		});
	});
});
