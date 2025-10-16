import { ObjectId } from '@mikro-orm/mongodb';
import { roleFactory } from '@modules/role/testing';
import { userDoFactory } from '@modules/user/testing';
import { groupFactory } from '../testing';
import { Group } from './group';
import { GroupUser } from './group-user';

describe(Group.name, () => {
	describe('removeUser', () => {
		describe('when the user is in the group', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.buildWithId(undefined, userId);
				const groupUser1 = new GroupUser({
					userId: user.id as string,
					roleId: new ObjectId().toHexString(),
				});
				const groupUser2 = new GroupUser({
					userId: new ObjectId().toHexString(),
					roleId: new ObjectId().toHexString(),
				});
				const group: Group = groupFactory.build({
					users: [groupUser1, groupUser2],
				});

				return {
					userId,
					user,
					groupUser1,
					groupUser2,
					group,
				};
			};

			it('should remove the user', () => {
				const { group, groupUser1, userId } = setup();

				group.removeUser(userId);

				expect(group.users).not.toContain(groupUser1);
			});

			it('should keep all other users', () => {
				const { group, groupUser2, userId } = setup();

				group.removeUser(userId);

				expect(group.users).toContain(groupUser2);
			});
		});

		describe('when the user is not in the group', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.buildWithId(undefined, userId);
				const groupUser2 = new GroupUser({
					userId: new ObjectId().toHexString(),
					roleId: new ObjectId().toHexString(),
				});
				const group = groupFactory.build({
					users: [groupUser2],
				});

				return {
					userId,
					user,
					groupUser2,
					group,
				};
			};

			it('should do nothing', () => {
				const { group, groupUser2, userId } = setup();

				group.removeUser(userId);

				expect(group.users).toEqual([groupUser2]);
			});
		});

		describe('when the group is empty', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.buildWithId(undefined, userId);
				const group = groupFactory.build({ users: [] });

				return {
					userId,
					user,
					group,
				};
			};

			it('should stay empty', () => {
				const { userId, group } = setup();

				group.removeUser(userId);

				expect(group.users).toEqual([]);
			});
		});
	});

	describe('isCurrentlyInValidPeriod', () => {
		const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
		const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

		describe('when group has no valid period', () => {
			it('should be true', () => {
				const group = groupFactory.build({ validPeriod: undefined });

				const isInValidPeriod = group.isCurrentlyInValidPeriod();

				expect(isInValidPeriod).toEqual(true);
			});
		});

		describe('when group has open ended period', () => {
			it('should be true after start', () => {
				const group = groupFactory.build({ validPeriod: { from: yesterday, until: undefined } });

				const isInValidPeriod = group.isCurrentlyInValidPeriod();

				expect(isInValidPeriod).toEqual(true);
			});

			it('should be false before start', () => {
				const group = groupFactory.build({ validPeriod: { from: tomorrow, until: undefined } });

				const isInValidPeriod = group.isCurrentlyInValidPeriod();

				expect(isInValidPeriod).toEqual(false);
			});
		});

		describe('when group has beginning and end date', () => {
			it('should be false before period', () => {
				const group = groupFactory.build({ validPeriod: { from: tomorrow, until: tomorrow } });

				const isInValidPeriod = group.isCurrentlyInValidPeriod();

				expect(isInValidPeriod).toEqual(false);
			});

			it('should be false after period', () => {
				const group = groupFactory.build({ validPeriod: { from: yesterday, until: yesterday } });

				const isInValidPeriod = group.isCurrentlyInValidPeriod();

				expect(isInValidPeriod).toEqual(false);
			});

			it('should be true during period', () => {
				const group = groupFactory.build({ validPeriod: { from: yesterday, until: tomorrow } });

				const isInValidPeriod = group.isCurrentlyInValidPeriod();

				expect(isInValidPeriod).toEqual(true);
			});
		});
	});

	describe('isEmpty', () => {
		describe('when no users in group exist', () => {
			const setup = () => {
				const group = groupFactory.build({ users: [] });

				return {
					group,
				};
			};

			it('should return true', () => {
				const { group } = setup();

				const isEmpty = group.isEmpty();

				expect(isEmpty).toEqual(true);
			});
		});

		describe('when users in group exist', () => {
			const setup = () => {
				const externalUserId = 'externalUserId';
				const role = roleFactory.buildWithId();
				const user = userDoFactory.buildWithId({ roles: [role], externalId: externalUserId });
				const group = groupFactory.build({ users: [{ userId: user.id as string, roleId: role.id }] });

				return {
					group,
				};
			};

			it('should return false', () => {
				const { group } = setup();

				const isEmpty = group.isEmpty();

				expect(isEmpty).toEqual(false);
			});
		});
	});

	describe('addUser', () => {
		describe('when the user already exists in the group', () => {
			const setup = () => {
				const existingUser = new GroupUser({
					userId: new ObjectId().toHexString(),
					roleId: new ObjectId().toHexString(),
				});
				const group = groupFactory.build({
					users: [existingUser],
				});

				return {
					group,
					existingUser,
				};
			};

			it('should not add the user', () => {
				const { group, existingUser } = setup();

				group.addUser(existingUser);

				expect(group.users.length).toEqual(1);
			});
		});

		describe('when the user does not exist in the group', () => {
			const setup = () => {
				const newUser = new GroupUser({
					userId: new ObjectId().toHexString(),
					roleId: new ObjectId().toHexString(),
				});
				const group = groupFactory.build({
					users: [
						{
							userId: new ObjectId().toHexString(),
							roleId: new ObjectId().toHexString(),
						},
					],
				});

				return {
					group,
					newUser,
				};
			};

			it('should add the user', () => {
				const { group, newUser } = setup();

				group.addUser(newUser);

				expect(group.users).toContain(newUser);
				expect(group.users.length).toEqual(2);
			});
		});
	});

	describe('isMember', () => {
		describe('when the user is a member of the group', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const roleId = new ObjectId().toHexString();
				const groupUser = new GroupUser({
					userId,
					roleId,
				});
				const group = groupFactory.build({
					users: [groupUser],
				});

				return {
					group,
					userId,
				};
			};

			it('should return true', () => {
				const { group, userId } = setup();

				const result = group.isMember(userId);

				expect(result).toEqual(true);
			});
		});

		describe('when the user is a member of the group and has the requested role', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const roleId = new ObjectId().toHexString();
				const groupUser = new GroupUser({
					userId,
					roleId,
				});
				const group = groupFactory.build({
					users: [groupUser],
				});

				return {
					group,
					userId,
					roleId,
				};
			};

			it('should return true', () => {
				const { group, userId, roleId } = setup();

				const result = group.isMember(userId, roleId);

				expect(result).toEqual(true);
			});
		});

		describe('when the user is a member of the group, but has a different role', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const roleId = new ObjectId().toHexString();
				const groupUser = new GroupUser({
					userId,
					roleId: new ObjectId().toHexString(),
				});
				const group = groupFactory.build({
					users: [groupUser],
				});

				return {
					group,
					userId,
					roleId,
				};
			};

			it('should return false', () => {
				const { group, userId, roleId } = setup();

				const result = group.isMember(userId, roleId);

				expect(result).toEqual(false);
			});
		});

		describe('when the user is not a member of the group', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const roleId = new ObjectId().toHexString();
				const groupUser = new GroupUser({
					userId: new ObjectId().toHexString(),
					roleId: new ObjectId().toHexString(),
				});
				const group = groupFactory.build({
					users: [groupUser],
				});

				return {
					group,
					userId,
					roleId,
				};
			};

			it('should return false', () => {
				const { group, userId } = setup();

				const result = group.isMember(userId);

				expect(result).toEqual(false);
			});
		});
	});
});
