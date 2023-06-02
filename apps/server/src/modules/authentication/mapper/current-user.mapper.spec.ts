import { ValidationError } from '@shared/common';
import { Permission, RoleName } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { roleFactory, schoolFactory, setupEntities, userDoFactory, userFactory } from '@shared/testing';
import { ICurrentUser } from '../interface';
import { JwtPayload } from '../interface/jwt-payload';
import { CurrentUserMapper } from './current-user.mapper';

describe('CurrentUserMapper', () => {
	const accountId = 'mockAccountId';

	beforeAll(async () => {
		await setupEntities();
	});

	describe('userToICurrentUser', () => {
		describe('when mapping from a user entity to the current user object', () => {
			it('should map with roles', () => {
				const teacherRole = roleFactory.buildWithId({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] });
				const user = userFactory.buildWithId({
					roles: [teacherRole],
				});
				const currentUser: ICurrentUser = CurrentUserMapper.userToICurrentUser(accountId, user);
				expect(currentUser).toMatchObject({
					accountId,
					systemId: undefined,
					roles: [teacherRole.id],
					schoolId: null,
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
				});
			});
		});

		describe('when userDO is valid and contains roles', () => {
			it('should return valid ICurrentUser instance without systemId', () => {
				const roleIds = ['mockRoleId'];
				const user: UserDO = userDoFactory.buildWithId({
					id: userId,
					createdAt: new Date(),
					updatedAt: new Date(),
					roles: roleIds,
				});
				const currentUser = CurrentUserMapper.userDoToICurrentUser(accountId, user);
				expect(currentUser).toMatchObject({
					accountId,
					systemId: undefined,
					roles: ['mockRoleId'],
					schoolId: user.schoolId,
					userId: user.id,
				});
			});
		});
	});

	describe('jwtToICurrentUser', () => {
		describe('when JWT is provided with all claims', () => {
			it('should return current user', () => {
				const jwtPayload: JwtPayload = {
					accountId: 'dummyAccountId',
					systemId: 'dummySystemId',
					roles: ['mockRoleId'],
					schoolId: 'dummySchoolId',
					userId: 'dummyUserId',
					support: true,
					sub: 'dummyAccountId',
					jti: 'random string',
					aud: 'some audience',
					iss: 'feathers',
					iat: Math.floor(new Date().getTime() / 1000),
					exp: Math.floor(new Date().getTime() / 1000) + 3600,
				};
				const currentUser = CurrentUserMapper.jwtToICurrentUser(jwtPayload);
				expect(currentUser).toMatchObject({
					accountId: jwtPayload.accountId,
					systemId: jwtPayload.systemId,
					roles: [jwtPayload.roles[0]],
					schoolId: jwtPayload.schoolId,
					userId: jwtPayload.userId,
					impersonated: jwtPayload.support,
				});
			});
		});
		describe('when JWT is provided without optional claims', () => {
			it('should return current user', () => {
				const jwtPayload: JwtPayload = {
					accountId: 'dummyAccountId',
					roles: ['mockRoleId'],
					schoolId: 'dummySchoolId',
					userId: 'dummyUserId',
					sub: 'dummyAccountId',
					jti: 'random string',
					aud: 'some audience',
					iss: 'feathers',
					iat: Math.floor(new Date().getTime() / 1000),
					exp: Math.floor(new Date().getTime() / 1000) + 3600,
				};
				const currentUser = CurrentUserMapper.jwtToICurrentUser(jwtPayload);
				expect(currentUser).toMatchObject({
					accountId: jwtPayload.accountId,
					roles: [jwtPayload.roles[0]],
					schoolId: jwtPayload.schoolId,
					userId: jwtPayload.userId,
				});
			});
		});
	});
});
