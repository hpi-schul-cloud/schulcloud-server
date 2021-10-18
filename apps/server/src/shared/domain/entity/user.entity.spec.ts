import { setupEntities } from '@src/modules/database';
import { User } from './user.entity';
import { schoolFactory } from '../factory';

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
			const user = new User({ email: 'john.doe@example.com', school: schoolFactory.build(), roles: [] });
			expect(user instanceof User).toEqual(true);
		});
	});
});
