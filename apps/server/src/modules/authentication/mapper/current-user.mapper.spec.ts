import { ValidationError } from '@shared/common';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { RoleName } from '@shared/domain/interface';
import { setupEntities, userDoFactory } from '@shared/testing';
import { OauthCurrentUser } from '../interface';
import { CurrentUserMapper } from './current-user.mapper';

describe('CurrentUserMapper', () => {
	const accountId = 'mockAccountId';

	beforeAll(async () => {
		await setupEntities();
	});

	describe('userToICurrentUser', () => {
		describe('when mapping from a user entity to the current user object', () => {
			describe('when user has roles', () => {
				const setup = () => {
					const teacherRole = roleFactory.buildWithId({
						name: RoleName.TEACHER,
						permissions: [Permission.STUDENT_EDIT],
					});
					const user = userFactory.buildWithId({
						roles: [teacherRole],
					});

					return {
						teacherRole,
						user,
					};
				};

				it('should map with roles', () => {
					const { teacherRole, user } = setup();

					const currentUser: ICurrentUser = CurrentUserMapper.userToICurrentUser(accountId, user, false);

					expect(currentUser).toMatchObject({
						accountId,
						systemId: undefined,
						roles: [teacherRole.id],
						schoolId: null,
						isExternalUser: false,
					});
				});
			});

			describe('when user has no roles', () => {
				it('should map without roles', () => {
					const user = userFactory.buildWithId();

					const currentUser: ICurrentUser = CurrentUserMapper.userToICurrentUser(accountId, user, true);

					expect(currentUser).toMatchObject({
						accountId,
						systemId: undefined,
						roles: [],
						schoolId: null,
						isExternalUser: true,
					});
				});
			});

			describe('when systemId is provided', () => {
				const setup = () => {
					const user = userFactory.buildWithId({
						school: schoolEntityFactory.buildWithId(),
					});
					const systemId = 'mockSystemId';

					return {
						user,
						systemId,
					};
				};

				it('should map system and school', () => {
					const { user, systemId } = setup();

					const currentUser: ICurrentUser = CurrentUserMapper.userToICurrentUser(accountId, user, false, systemId);

					expect(currentUser).toMatchObject({
						accountId,
						systemId,
						roles: [],
						schoolId: user.school.id,
						isExternalUser: false,
					});
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
});
