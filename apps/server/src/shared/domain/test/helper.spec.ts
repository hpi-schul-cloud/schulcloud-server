import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '../types';
import { BaseEntity } from '../entity';

import { TestHelper } from './helper';

function createTestHelper(outputUser?: BaseEntity | EntityId, outputSchool?: EntityId): TestHelper<EntityId> {
	class NewHelper extends TestHelper<EntityId> {
		createSchool(): EntityId {
			return outputSchool || 'school';
		}

		createUser(): BaseEntity | EntityId {
			return outputUser || 'user';
		}
	}
	return new NewHelper();
}

describe('TestHelper', () => {
	describe('constructor', () => {
		it('should possible to extends', () => {
			const helper = createTestHelper();

			expect(helper).toBeDefined();
		});

		it('should add initial first user', () => {
			const helper = createTestHelper();

			expect(helper.users.length).toEqual(1);
			expect(helper.users[0]).toBeDefined();
		});

		it('should add initial first other user', () => {
			const helper = createTestHelper();

			expect(helper.otherUser).toBeDefined();
		});

		it('should add initial school', () => {
			const helper = createTestHelper();

			expect(helper.school).toBeDefined();
		});
	});

	describe('methodes', () => {
		describe('createId', () => {
			it('should create an objectId', () => {
				const helper = createTestHelper();

				const result = helper.createId();

				expect(result).toBeInstanceOf(ObjectId);
			});
		});

		describe('createEntityId', () => {
			it('should create a createEntityId', () => {
				const helper = createTestHelper();

				const result = helper.createEntityId();

				expect(typeof result).toEqual('string');
			});
		});

		describe('getFirstUser', () => {
			it('should return the auto generated user of index 0 from users.', () => {
				const user = 'user123';
				const helper = createTestHelper(user);

				const result = helper.getFirstUser();

				expect(result).toEqual(user);
			});
		});

		describe('getOtherUser', () => {
			it('should return the auto generated user', () => {
				const user = 'user123';
				const helper = createTestHelper(user);

				const result = helper.getOtherUser();

				expect(result).toEqual(user);
			});
		});

		describe('getSchool', () => {
			it('should return the auto generated school', () => {
				const school = 'school123';
				const helper = createTestHelper('', school);

				const result = helper.getSchool();

				expect(result).toEqual(school);
			});
		});

		describe('createAndAddUser', () => {
			class TestEntity extends BaseEntity {}

			it('should create a new user', () => {
				const helper = createTestHelper();

				// precondition is that one user is inside
				expect(helper.users.length).toEqual(1);

				helper.createAndAddUser();

				expect(helper.users.length).toEqual(2);
			});

			it('should solve passing parameter Entity to target EntityId', () => {
				const helper = createTestHelper();
				const user = new TestEntity();
				user.id = 'superuser';

				helper.createAndAddUser(user);

				expect(helper.users[1]).toEqual(user.id);
			});

			it('should solve passing parameter EntityId to target EntityId', () => {
				const helper = createTestHelper();
				const user = 'superuser';

				helper.createAndAddUser(user);

				expect(helper.users[1]).toEqual(user);
			});

			it('should solve passing parameter EntityId to target Entity', () => {
				const helper = createTestHelper(new TestEntity());
				const user = 'superuser';

				helper.createAndAddUser(user);

				const foundUser = helper.users[1] as BaseEntity;
				expect(foundUser.id).toEqual(user);
			});

			it('should solve passing parameter Entity to target Entity', () => {
				const helper = createTestHelper(new TestEntity());
				const user = new TestEntity();
				user.id = 'superuser';

				helper.createAndAddUser(user);

				const foundUser = helper.users[1] as BaseEntity;
				expect(foundUser.id).toEqual(user.id);
			});
		});

		describe('getUsers', () => {
			it('should return the users array that include the auto generated user at index 0', () => {
				const user = 'user123';
				const helper = createTestHelper(user);

				const result = helper.getUsers();

				expect(result.length).toEqual(1);
				expect(result[0]).toEqual(user);
			});

			it('should also includes additional generated users', () => {
				const user = 'user123';
				const additionalUser = 'user345';
				const helper = createTestHelper(user);
				helper.createAndAddUser(additionalUser);

				const result = helper.getUsers();

				expect(result.length).toEqual(2);
				expect(result[1]).toEqual(additionalUser);
			});
		});
	});
});
