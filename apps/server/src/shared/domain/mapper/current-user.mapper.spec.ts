import { MikroORM } from '@mikro-orm/core';
import { Permission, RoleName } from '@shared/domain';
import { roleFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { ICurrentUser } from '../interface';
import { CurrentUserMapper } from './current-user.mapper';

describe('CurrentUserMapper', () => {
	const accountId = 'mockAccountId';
	const systemId = 'mockSystemId';
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('when mapping from a user entity to the current user object', () => {
		it('should map without systemId', () => {
			const role = roleFactory.buildWithId({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] });
			const user = userFactory.buildWithId({
				roles: [role],
				school: schoolFactory.buildWithId(),
			});

			const currentUser: ICurrentUser = CurrentUserMapper.userToICurrentUser(accountId, user);

			expect(currentUser).toEqual<ICurrentUser>({
				accountId,
				systemId: undefined,
				userId: user.id,
				roles: [role.id],
				schoolId: user.school.id,
				user: {
					id: user.id,
					schoolId: user.school.id,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
					firstName: user.firstName,
					lastName: user.lastName,
					roles: [
						{
							id: role.id,
							name: role.name,
						},
					],
					permissions: role.permissions,
				},
			});
		});

		it('should map with systemId', () => {
			const role = roleFactory.buildWithId({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] });
			const user = userFactory.buildWithId({
				roles: [role],
				school: schoolFactory.buildWithId(),
			});

			const currentUser: ICurrentUser = CurrentUserMapper.userToICurrentUser(accountId, user, systemId);

			expect(currentUser).toEqual<ICurrentUser>({
				accountId,
				systemId,
				userId: user.id,
				roles: [role.id],
				schoolId: user.school.id,
				user: {
					id: user.id,
					schoolId: user.school.id,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
					firstName: user.firstName,
					lastName: user.lastName,
					roles: [
						{
							id: role.id,
							name: role.name,
						},
					],
					permissions: role.permissions,
				},
			});
		});

		it('should map without roles', () => {
			const user = userFactory.buildWithId({
				roles: [],
				school: schoolFactory.buildWithId(),
			});

			const currentUser: ICurrentUser = CurrentUserMapper.userToICurrentUser(accountId, user, systemId);

			expect(currentUser).toEqual<ICurrentUser>({
				accountId,
				systemId,
				userId: user.id,
				roles: [],
				schoolId: user.school.id,
				user: {
					id: user.id,
					schoolId: user.school.id,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
					firstName: user.firstName,
					lastName: user.lastName,
					roles: [],
					permissions: [],
				},
			});
		});
	});
});
