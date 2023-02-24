import { MikroORM } from '@mikro-orm/core';
import { ValidationError } from '@shared/common';
import { Permission, Role, RoleName, EntityId } from '@shared/domain';
import { schoolFactory, setupEntities, userDoFactory, userFactory } from '@shared/testing';
import { UserDO } from '../domainobject/user.do';
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

	describe('userToICurrentUser', () => {
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

	describe('userDoToICurrentUser', () => {
		const userId = 'mockUserId';
		describe('when userDO has no ID', () => {
			it('should throw error', () => {
				const user: UserDO = userDoFactory.build({ createdAt: new Date(), updatedAt: new Date() });
				expect(() => CurrentUserMapper.userDoToICurrentUser(accountId, user)).toThrow(ValidationError);
			});
		});
		describe('when userDO has no createdAt', () => {
			it('should throw error', () => {
				const user: UserDO = userDoFactory.buildWithId({ id: userId, updatedAt: new Date() });
				expect(() => CurrentUserMapper.userDoToICurrentUser(accountId, user)).toThrow(ValidationError);
			});
		});
		describe('when userDO has no updatedAt', () => {
			it('should throw error', () => {
				const user: UserDO = userDoFactory.buildWithId({ id: userId, createdAt: new Date() });
				expect(() => CurrentUserMapper.userDoToICurrentUser(accountId, user)).toThrow(ValidationError);
			});
		});
		describe('when userDO is valid', () => {
			it('should return valid ICurrentUser instance', () => {
				const user: UserDO = userDoFactory.buildWithId({ id: userId, createdAt: new Date(), updatedAt: new Date() });
				const currentUser = CurrentUserMapper.userDoToICurrentUser(accountId, user);
				expect(currentUser).toMatchObject({
					accountId,
					systemId: undefined,
					roles: [],
					schoolId: user.schoolId,
					userId: user.id,
					user: {
						id: user.id,
						createdAt: user.createdAt,
						updatedAt: user.updatedAt,
						firstName: user.firstName,
						lastName: user.lastName,
						roles: [],
						schoolId: user.schoolId,
						permissions: [],
					},
				});
			});
		});

		describe('when userDO is valid and a systemId is provided', () => {
			it('should return valid ICurrentUser instance with systemId', () => {
				const user: UserDO = userDoFactory.buildWithId({ id: userId, createdAt: new Date(), updatedAt: new Date() });
				const systemId = 'mockSystemId';
				const currentUser = CurrentUserMapper.userDoToICurrentUser(accountId, user, systemId);
				expect(currentUser).toMatchObject({
					accountId,
					systemId,
					roles: [],
					schoolId: user.schoolId,
					userId: user.id,
					user: {
						id: user.id,
						createdAt: user.createdAt,
						updatedAt: user.updatedAt,
						firstName: user.firstName,
						lastName: user.lastName,
						roles: [],
						schoolId: user.schoolId,
						permissions: [],
					},
				});
			});
		});

		describe('when userDO is valid and contains roles', () => {
			it('should return valid ICurrentUser instance with systemId', () => {
				const roleIds = ['mockRoleId'];
				const user: UserDO = userDoFactory.buildWithId({
					id: userId,
					createdAt: new Date(),
					updatedAt: new Date(),
					roleIds,
				});
				const currentUser = CurrentUserMapper.userDoToICurrentUser(accountId, user);
				expect(currentUser).toMatchObject({
					accountId,
					systemId: undefined,
					roles: ['mockRoleId'],
					schoolId: user.schoolId,
					userId: user.id,
					user: {
						id: user.id,
						createdAt: user.createdAt,
						updatedAt: user.updatedAt,
						firstName: user.firstName,
						lastName: user.lastName,
						roles: [{ id: 'mockRoleId', name: 'mockRoleId' }],
						schoolId: user.schoolId,
						permissions: [],
					},
				});
			});
		});
	});
});
