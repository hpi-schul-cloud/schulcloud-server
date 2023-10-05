import { groupFactory } from '@shared/testing';

import { ObjectId } from 'bson';
import { GroupUser } from './group-user';

describe('Group (Domain Object)', () => {
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
