import { MikroORM } from '@mikro-orm/core';
import { Permission, Role, RoleName } from '@shared/domain';
import { schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { ICurrentUser } from '../interface';
import { CurrentUserMapper } from './current-user.mapper';

describe('CurrentUserMapper', () => {
	const accountId = 'mockAccountId';
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('when mapping from a user entity to the current user object', () => {
		it('should map with roles', () => {
			const user = userFactory.buildWithId({
				roles: [new Role({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] })],
			});
			const currentUser: ICurrentUser = CurrentUserMapper.userToICurrentUser(accountId, user);
			expect(currentUser).toMatchObject({
				accountId,
				systemId: undefined,
				roles: ['teacher'],
				schoolId: null,
				user: {
					firstName: user.firstName,
					lastName: user.lastName,
					roles: [
						{
							id: null,
							name: 'teacher',
						},
					],
					permissions: ['STUDENT_EDIT'],
				},
			});
		});

		it('should map without roles', () => {
			const user = userFactory.buildWithId();
			const currentUser: ICurrentUser = CurrentUserMapper.userToICurrentUser(accountId, user);
			expect(currentUser).toMatchObject({
				accountId,
				systemId: undefined,
				roles: [],
				schoolId: null,
				user: {
					firstName: user.firstName,
					lastName: user.lastName,
					roles: [],
					permissions: [],
				},
			});
		});

		it('should map system and school', () => {
			const user = userFactory.buildWithId({
				school: schoolFactory.buildWithId(),
			});
			const systemId = 'mockSystemId';
			const currentUser: ICurrentUser = CurrentUserMapper.userToICurrentUser(accountId, user, systemId);
			expect(currentUser).toMatchObject({
				accountId,
				systemId,
				roles: [],
				schoolId: user.school.id,
				user: {
					firstName: user.firstName,
					lastName: user.lastName,
					roles: [],
					permissions: [],
				},
			});
		});
	});
});
