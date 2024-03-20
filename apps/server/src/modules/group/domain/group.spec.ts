import { RoleReference, UserDO } from '@shared/domain/domainobject';
import { groupFactory, roleFactory, userDoFactory } from '@shared/testing';

import { ObjectId } from '@mikro-orm/mongodb';
import { Group } from './group';
import { GroupUser } from './group-user';

describe('Group (Domain Object)', () => {
	describe('removeUser', () => {
		describe('when the user is in the group', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();
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
					user,
					groupUser1,
					groupUser2,
					group,
				};
			};

			it('should remove the user', () => {
				const { user, group, groupUser1 } = setup();

				group.removeUser(user);

				expect(group.users).not.toContain(groupUser1);
			});

			it('should keep all other users', () => {
				const { user, group, groupUser2 } = setup();

				group.removeUser(user);

				expect(group.users).toContain(groupUser2);
			});
		});

		describe('when the user is not in the group', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();
				const groupUser2 = new GroupUser({
					userId: new ObjectId().toHexString(),
					roleId: new ObjectId().toHexString(),
				});
				const group: Group = groupFactory.build({
					users: [groupUser2],
				});

				return {
					user,
					groupUser2,
					group,
				};
			};

			it('should do nothing', () => {
				const { user, group, groupUser2 } = setup();

				group.removeUser(user);

				expect(group.users).toEqual([groupUser2]);
			});
		});

		describe('when the group is empty', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();
				const group: Group = groupFactory.build({ users: [] });

				return {
					user,
					group,
				};
			};

			it('should stay empty', () => {
				const { user, group } = setup();

				group.removeUser(user);

				expect(group.users).toEqual([]);
			});
		});
	});

	describe('isEmpty', () => {
		describe('when no users in group exist', () => {
			const setup = () => {
				const group: Group = groupFactory.build({ users: [] });

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
				const role: RoleReference = roleFactory.buildWithId();
				const user: UserDO = userDoFactory.buildWithId({ roles: [role], externalId: externalUserId });
				const group: Group = groupFactory.build({ users: [{ userId: user.id as string, roleId: role.id }] });

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
				const existingUser: GroupUser = new GroupUser({
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
				const newUser: GroupUser = new GroupUser({
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
});
