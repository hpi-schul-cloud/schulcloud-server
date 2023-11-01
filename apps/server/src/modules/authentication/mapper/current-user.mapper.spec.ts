import { ValidationError } from '@shared/common';
import { Permission, RoleName } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { roleFactory, schoolFactory, setupEntities, userDoFactory, userFactory } from '@shared/testing';
import { ICurrentUser, OauthCurrentUser } from '../interface';
import { CreateJwtPayload, JwtPayload } from '../interface/jwt-payload';
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

	describe('OauthCurrentUser', () => {
		const userIdMock = 'mockUserId';
		describe('when userDO has no ID', () => {
			it('should throw error', () => {
				const user: UserDO = userDoFactory.build({ createdAt: new Date(), updatedAt: new Date() });

				expect(() => CurrentUserMapper.mapToOauthCurrentUser(accountId, user, undefined, 'idToken')).toThrow(
					ValidationError
				);
			});
		});

		describe('when userDO is valid', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId({
					id: userIdMock,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
				const idToken = 'idToken';

				return {
					user,
					userId: user.id as string,
					idToken,
				};
			};

			it('should return valid oauth current user instance', () => {
				const { user, userId, idToken } = setup();

				const currentUser: OauthCurrentUser = CurrentUserMapper.mapToOauthCurrentUser(
					accountId,
					user,
					undefined,
					idToken
				);

				expect(currentUser).toMatchObject<OauthCurrentUser>({
					accountId,
					systemId: undefined,
					roles: [],
					schoolId: user.schoolId,
					userId,
					externalIdToken: idToken,
					isExternalUser: true,
				});
			});
		});

		describe('when userDO is valid and a systemId is provided', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId({
					id: userIdMock,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
				const systemId = 'mockSystemId';
				const idToken = 'idToken';

				return {
					user,
					userId: user.id as string,
					idToken,
					systemId,
				};
			};

			it('should return valid ICurrentUser instance with systemId', () => {
				const { user, userId, systemId, idToken } = setup();

				const currentUser: OauthCurrentUser = CurrentUserMapper.mapToOauthCurrentUser(
					accountId,
					user,
					systemId,
					idToken
				);

				expect(currentUser).toMatchObject<OauthCurrentUser>({
					accountId,
					systemId,
					roles: [],
					schoolId: user.schoolId,
					userId,
					externalIdToken: idToken,
					isExternalUser: true,
				});
			});
		});

		describe('when userDO is valid and contains roles', () => {
			const setup = () => {
				const user: UserDO = userDoFactory
					.withRoles([
						{
							id: 'mockRoleId',
							name: RoleName.USER,
						},
					])
					.buildWithId({
						id: userIdMock,
						createdAt: new Date(),
						updatedAt: new Date(),
					});

				return {
					user,
				};
			};

			it('should return valid ICurrentUser instance without systemId', () => {
				const { user } = setup();

				const currentUser = CurrentUserMapper.mapToOauthCurrentUser(accountId, user, undefined, 'idToken');

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
			const setup = () => {
				const jwtPayload: JwtPayload = {
					accountId: 'dummyAccountId',
					systemId: 'dummySystemId',
					roles: ['mockRoleId'],
					schoolId: 'dummySchoolId',
					userId: 'dummyUserId',
					support: true,
					isExternalUser: true,
					sub: 'dummyAccountId',
					jti: 'random string',
					aud: 'some audience',
					iss: 'feathers',
					iat: Math.floor(new Date().getTime() / 1000),
					exp: Math.floor(new Date().getTime() / 1000) + 3600,
				};

				return {
					jwtPayload,
				};
			};

			it('should return current user', () => {
				const { jwtPayload } = setup();

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

			it('should return current user with default for isExternalUser', () => {
				const { jwtPayload } = setup();

				const currentUser = CurrentUserMapper.jwtToICurrentUser(jwtPayload);

				expect(currentUser).toMatchObject({
					isExternalUser: jwtPayload.isExternalUser,
				});
			});
		});

		describe('when JWT is provided without optional claims', () => {
			const setup = () => {
				const jwtPayload: JwtPayload = {
					accountId: 'dummyAccountId',
					roles: ['mockRoleId'],
					schoolId: 'dummySchoolId',
					userId: 'dummyUserId',
					isExternalUser: false,
					sub: 'dummyAccountId',
					jti: 'random string',
					aud: 'some audience',
					iss: 'feathers',
					iat: Math.floor(new Date().getTime() / 1000),
					exp: Math.floor(new Date().getTime() / 1000) + 3600,
				};

				return {
					jwtPayload,
				};
			};

			it('should return current user', () => {
				const { jwtPayload } = setup();

				const currentUser = CurrentUserMapper.jwtToICurrentUser(jwtPayload);

				expect(currentUser).toMatchObject({
					accountId: jwtPayload.accountId,
					roles: [jwtPayload.roles[0]],
					schoolId: jwtPayload.schoolId,
					userId: jwtPayload.userId,
					isExternalUser: false,
				});
			});

			it('should return current user with default for isExternalUser', () => {
				const { jwtPayload } = setup();

				const currentUser = CurrentUserMapper.jwtToICurrentUser(jwtPayload);

				expect(currentUser).toMatchObject({
					isExternalUser: false,
				});
			});
		});
	});

	describe('mapCurrentUserToCreateJwtPayload', () => {
		it('should map current user to create jwt payload', () => {
			const currentUser: ICurrentUser = {
				accountId: 'dummyAccountId',
				systemId: 'dummySystemId',
				roles: ['mockRoleId'],
				schoolId: 'dummySchoolId',
				userId: 'dummyUserId',
				impersonated: true,
				isExternalUser: false,
			};

			const createJwtPayload: CreateJwtPayload = CurrentUserMapper.mapCurrentUserToCreateJwtPayload(currentUser);

			expect(createJwtPayload).toMatchObject<CreateJwtPayload>({
				accountId: currentUser.accountId,
				systemId: currentUser.systemId,
				roles: currentUser.roles,
				schoolId: currentUser.schoolId,
				userId: currentUser.userId,
				support: currentUser.impersonated,
				isExternalUser: false,
			});
		});
	});
});
