import { ObjectId } from '@mikro-orm/mongodb';

import { User } from './user.entity';

describe('User Entity', () => {
	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new User();
			expect(test).toThrow();
		});

		it('should create a user by passing required properties', () => {
			const schoolId = new ObjectId().toHexString();
			const user = new User({ firstName: '', lastName: '', school: schoolId, email: 'test@email.de' });
			expect(user instanceof User).toEqual(true);
		});
	});
});
