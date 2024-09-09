import { ValidationError } from '@shared/common';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { Permission, RoleName } from '@shared/domain/interface';
import { roleFactory, schoolEntityFactory, setupEntities, userDoFactory, userFactory } from '@shared/testing';
import { ObjectId } from 'bson';
import { OauthCurrentUser } from '../interface';
import { CurrentUserMapper } from './current-user.mapper';

describe('CurrentUserMapper', () => {
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
					const accountId = new ObjectId().toHexString();

					return {
						teacherRole,
						user,
						accountId,
					};
				};

				it('should map with roles', () => {
					const { accountId, teacherRole, user } = setup();

					const currentUser = CurrentUserMapper.userToICurrentUser(accountId, user, false);

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
				const setup = () => {
					const user = userFactory.buildWithId();
					const accountId = new ObjectId().toHexString();

					return {
						accountId,
						user,
					};
				};

				it('should map without roles', () => {
					const { accountId, user } = setup();

					const currentUser = CurrentUserMapper.userToICurrentUser(accountId, user, true);

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
					const accountId = new ObjectId().toHexString();

					return {
						user,
						systemId,
						accountId,
					};
				};

				it('should map system and school', () => {
					const { accountId, user, systemId } = setup();

					const currentUser = CurrentUserMapper.userToICurrentUser(accountId, user, false, systemId);

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
		describe('when userDO has no ID', () => {
			const setup = () => {
				const user = userDoFactory.build({ createdAt: new Date(), updatedAt: new Date() });
				const accountId = new ObjectId().toHexString();

				return {
					user,
					accountId,
				};
			};

			it('should throw error', () => {
				const { accountId, user } = setup();

				expect(() => CurrentUserMapper.mapToOauthCurrentUser(accountId, user, undefined, 'idToken')).toThrow(
					ValidationError
				);
			});
		});

		describe('when userDO is valid', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId({
					id: 'mockUserId',
					createdAt: new Date(),
					updatedAt: new Date(),
				});
				const idToken = 'idToken';
				const accountId = new ObjectId().toHexString();

				return {
					user,
					userId: user.id as string,
					idToken,
					accountId,
				};
			};

			it('should return valid oauth current user instance', () => {
				const { accountId, user, userId, idToken } = setup();

				const currentUser = CurrentUserMapper.mapToOauthCurrentUser(accountId, user, undefined, idToken);

				expect(currentUser).toMatchObject<OauthCurrentUser>({
					accountId,
					systemId: undefined,
					roles: [],
					schoolId: user.schoolId,
					userId,
					externalIdToken: idToken,
					isExternalUser: true,
					impersonated: false,
				});
			});
		});

		describe('when userDO is valid and a systemId is provided', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId({
					id: 'mockUserId',
					createdAt: new Date(),
					updatedAt: new Date(),
				});
				const systemId = 'mockSystemId';
				const idToken = 'idToken';
				const accountId = new ObjectId().toHexString();

				return {
					user,
					userId: user.id as string,
					idToken,
					systemId,
					accountId,
				};
			};

			it('should return valid ICurrentUser instance with systemId', () => {
				const { accountId, user, userId, systemId, idToken } = setup();

				const currentUser = CurrentUserMapper.mapToOauthCurrentUser(accountId, user, systemId, idToken);

				expect(currentUser).toMatchObject<OauthCurrentUser>({
					accountId,
					systemId,
					roles: [],
					schoolId: user.schoolId,
					userId,
					externalIdToken: idToken,
					isExternalUser: true,
					impersonated: false,
				});
			});
		});

		describe('when userDO is valid and contains roles', () => {
			const setup = () => {
				const user = userDoFactory
					.withRoles([
						{
							id: 'mockRoleId',
							name: RoleName.USER,
						},
					])
					.buildWithId({
						id: 'mockUserId',
						createdAt: new Date(),
						updatedAt: new Date(),
					});
				const accountId = new ObjectId().toHexString();

				return {
					user,
					accountId,
				};
			};

			it('should return valid ICurrentUser instance without systemId', () => {
				const { accountId, user } = setup();

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
