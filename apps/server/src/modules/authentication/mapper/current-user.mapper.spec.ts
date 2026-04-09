import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { User } from '@modules/user';
import { UserDo } from '@modules/user';
import { userDoFactory, userFactory } from '@modules/user/testing';
import { ValidationError } from '@shared/common/error';
import { RoleReference } from '@shared/domain/domainobject';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { ObjectId } from '@mikro-orm/mongodb';
import { OauthCurrentUser } from '../interface';
import { CurrentUserMapper } from './current-user.mapper';
import { Account } from '@modules/account';

describe('CurrentUserMapper', () => {
	beforeAll(async () => {
		await setupEntities([User]);
	});

	describe('extractRoleIds', () => {
		it('should return empty array if roles is undefined', () => {
			const roles: string[] = (
				CurrentUserMapper as unknown as { extractRoleIds: (roles?: RoleReference[]) => string[] }
			).extractRoleIds(undefined);
			expect(roles).toEqual([]);
		});

		it('should return empty array if roles is empty', () => {
			const roles: string[] = (
				CurrentUserMapper as unknown as { extractRoleIds: (roles?: RoleReference[]) => string[] }
			).extractRoleIds([]);
			expect(roles).toEqual([]);
		});

		it('should extract ids from RoleReference array', () => {
			const roleRefs: RoleReference[] = [
				new RoleReference({ id: 'r1', name: RoleName.TEACHER }),
				new RoleReference({ id: 'r2', name: RoleName.STUDENT }),
			];
			const roles: string[] = (
				CurrentUserMapper as unknown as { extractRoleIds: (roles?: RoleReference[]) => string[] }
			).extractRoleIds(roleRefs);
			expect(roles).toEqual(['r1', 'r2']);
		});
	});

	describe('userToICurrentUser', () => {
		describe('when mapping from a user entity to the current user object', () => {
			describe('when user has roles', () => {
				const buildAccountId = () => new ObjectId().toHexString();

				const buildTeacherUserWithRole = () => {
					const teacherRole = roleFactory.buildWithId({
						name: RoleName.TEACHER,
						permissions: [Permission.STUDENT_EDIT],
					});
					const user = userFactory.buildWithId({ roles: [teacherRole] });
					return { teacherRole, user };
				};

				const setup = () => {
					const { teacherRole, user } = buildTeacherUserWithRole();
					const accountId = buildAccountId();

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
						schoolId: user.school.id,
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
						schoolId: user.school.id,
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

					expect(currentUser).toMatchObject<OauthCurrentUser>({
						accountId,
						systemId,
						roles: [],
						schoolId: user.school.id,
						isExternalUser: false,
						userId: user.id,
						support: false,
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
					support: false,
				});
			});
		});

		describe('when userDO is valid and a systemId is provided', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId({
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
					support: false,
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

				expect(currentUser).toMatchObject<OauthCurrentUser>({
					accountId,
					systemId: undefined,
					roles: ['mockRoleId'],
					schoolId: user.schoolId,
					userId: user.id ?? '',
					support: false,
					isExternalUser: true,
				});
			});
		});

		describe('when userDO is valid and no externalIdToken is provided', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId({
					id: 'mockUserIdWithoutToken',
					createdAt: new Date(),
					updatedAt: new Date(),
				});
				const accountId = new ObjectId().toHexString();

				return {
					user,
					accountId,
				};
			};

			it('should return ICurrentUser instance without externalIdToken and isExternalUser=false', () => {
				const { accountId, user } = setup();

				const currentUser = CurrentUserMapper.mapToOauthCurrentUser(accountId, user);

				expect(currentUser).toMatchObject({
					accountId,
					systemId: undefined,
					roles: [],
					schoolId: user.schoolId,
					userId: user.id,
					isExternalUser: false,
				});
				expect(currentUser.externalIdToken).toBeUndefined();
			});
		});

		describe('mapToErwinCurrentUser', () => {
			describe('when user has roles', () => {
				const setup = () => {
					const teacherRole = roleFactory.buildWithId({
						name: RoleName.TEACHER,
						permissions: [Permission.STUDENT_EDIT],
					});
					const user = userDoFactory.buildWithId({
						roles: [{ id: teacherRole.id, name: teacherRole.name }],
					});

					const systemId = new ObjectId().toHexString();

					const account = {
						id: new ObjectId().toHexString(),
						userId: new ObjectId().toHexString(),
						systemId: systemId,
					} as Account;

					return {
						teacherRole,
						user,
						account,
					};
				};

				it('should map with roles', () => {
					const { account, teacherRole, user } = setup();

					const currentUser = CurrentUserMapper.mapToErwinCurrentUser(account, user, undefined, false);
					const accountId = account.id;

					expect(currentUser).toMatchObject({
						accountId,
						systemId: undefined,
						roles: [teacherRole.id],
						schoolId: user.schoolId,
						isExternalUser: false,
					});
				});
			});

			describe('when user has no roles', () => {
				const setup = () => {
					const user = userDoFactory.buildWithId();
					const systemId = new ObjectId().toHexString();

					const account = {
						id: new ObjectId().toHexString(),
						userId: new ObjectId().toHexString(),
						systemId: systemId,
					} as Account;

					return {
						account,
						user,
					};
				};

				it('should map without roles', () => {
					const { account, user } = setup();

					const currentUser = CurrentUserMapper.mapToErwinCurrentUser(account, user, undefined, true);
					const accountId = account.id;

					expect(currentUser).toMatchObject({
						accountId,
						systemId: undefined,
						roles: [],
						schoolId: user.schoolId,
						isExternalUser: false,
					});
				});
			});

			describe('when systemId is provided', () => {
				const setup = () => {
					const user = userDoFactory.buildWithId();
					const systemId = 'mockSystemId';
					const account = {
						id: new ObjectId().toHexString(),
						userId: new ObjectId().toHexString(),
						systemId: systemId,
					} as Account;

					return {
						user,
						systemId,
						account,
					};
				};

				it('should map system and school', () => {
					const { account, user, systemId } = setup();

					const currentUser = CurrentUserMapper.mapToErwinCurrentUser(account, user, systemId, false);
					const accountId = account.id;

					expect(currentUser).toMatchObject({
						accountId,
						systemId,
						roles: [],
						schoolId: user.schoolId,
						isExternalUser: false,
					});
				});
			});

			describe('when user has schoolId property', () => {
				const setup = () => {
					const user = userDoFactory.buildWithId({
						schoolId: 'mockSchoolId',
						roles: [],
					});
					const systemId = new ObjectId().toHexString();
					const account = {
						id: new ObjectId().toHexString(),
						userId: new ObjectId().toHexString(),
						systemId: systemId,
					} as Account;

					return {
						user,
						account,
					};
				};

				it('should use schoolId property', () => {
					const { account, user } = setup();

					const currentUser = CurrentUserMapper.mapToErwinCurrentUser(account, user, undefined, false);
					const accountId = account.id;

					expect(currentUser).toMatchObject({
						accountId,
						systemId: undefined,
						roles: [],
						schoolId: 'mockSchoolId',
						userId: user.id,
						isExternalUser: false,
					});
				});
			});

			describe('when roles is a collection with getItems', () => {
				const setup = () => {
					const user = userDoFactory.buildWithId({
						schoolId: 'mockSchoolId',
						roles: [
							{ id: 'mockRoleId1', name: RoleName.TEACHER },
							{ id: 'mockRoleId2', name: RoleName.STUDENT },
						],
					});
					const systemId = new ObjectId().toHexString();
					const account = {
						id: new ObjectId().toHexString(),
						userId: new ObjectId().toHexString(),
						systemId: systemId,
					} as Account;

					return {
						user,
						account,
					};
				};

				it('should map roles correctly', () => {
					const { account, user } = setup();

					const currentUser = CurrentUserMapper.mapToErwinCurrentUser(account, user, undefined, false);
					const accountId = account.id;

					expect(currentUser).toMatchObject({
						accountId,
						systemId: undefined,
						roles: ['mockRoleId1', 'mockRoleId2'],
						schoolId: 'mockSchoolId',
						userId: user.id,
						isExternalUser: false,
					});
				});
			});

			describe('when isExternalUser is not provided', () => {
				const setup = () => {
					const user = userDoFactory.buildWithId();
					const systemId = new ObjectId().toHexString();
					const account = {
						id: new ObjectId().toHexString(),
						userId: new ObjectId().toHexString(),
						systemId: systemId,
					} as Account;

					return {
						account,
						user,
					};
				};

				it('should default isExternalUser to false', () => {
					const { account, user } = setup();

					const currentUser = CurrentUserMapper.mapToErwinCurrentUser(account, user);

					expect(currentUser.isExternalUser).toBe(false);
				});
			});

			it('should use SVS systemId if present', () => {
				const systemId = 'svsSystemId';
				const user = userDoFactory.build({
					id: 'userId',
					schoolId: 'schoolId',
					roles: [],
				});

				const account = {
					id: new ObjectId().toHexString(),
					userId: new ObjectId().toHexString(),
					systemId: systemId,
				} as Account;
				const accountId = account.id;

				const currentUser = CurrentUserMapper.mapToErwinCurrentUser(account, user, systemId);

				expect(currentUser).toMatchObject({
					accountId,
					systemId: systemId,
					roles: [],
					schoolId: 'schoolId',
					userId: 'userId',
					isExternalUser: false,
				});
			});

			it('should use Erwin systemId and set isExternalUser=true if user.externalId exists and no SVS systemId', () => {
				const user = userDoFactory.build({
					id: 'userId',
					schoolId: 'schoolId',
					roles: [],
					externalId: 'erwinExternalId',
				});
				const systemId = 'erwinSystemId';
				const account = {
					id: new ObjectId().toHexString(),
					userId: new ObjectId().toHexString(),
				} as Account;
				const accountId = account.id;

				const currentUser = CurrentUserMapper.mapToErwinCurrentUser(account, user, systemId);

				expect(currentUser).toMatchObject({
					accountId,
					systemId: systemId,
					roles: [],
					schoolId: 'schoolId',
					userId: 'userId',
					isExternalUser: true,
				});
			});

			it('should set systemId undefined and isExternalUser=false if no systemId and no externalId', () => {
				const user = userDoFactory.build({
					id: 'userId',
					schoolId: 'schoolId',
					roles: [],
				});
				const account = {
					id: new ObjectId().toHexString(),
					userId: new ObjectId().toHexString(),
				} as Account;
				const accountId = account.id;

				const currentUser = CurrentUserMapper.mapToErwinCurrentUser(account, user);

				expect(currentUser).toMatchObject({
					accountId,
					systemId: undefined,
					roles: [],
					schoolId: 'schoolId',
					userId: 'userId',
					isExternalUser: false,
				});
			});

			it('should not incorrectly match SVS branch when both systemId and account.systemId are undefined', () => {
				const user = userDoFactory.build({
					id: 'userId',
					schoolId: 'schoolId',
					roles: [],
					externalId: 'erwinExternalId',
				});
				const account = {
					id: new ObjectId().toHexString(),
					userId: new ObjectId().toHexString(),
					systemId: undefined,
				} as Account;
				const accountId = account.id;

				// When systemId param is undefined and account.systemId is undefined,
				// the SVS branch should NOT be taken (strict equality + defined check).
				// Instead, the externalId branch should be used.
				const currentUser = CurrentUserMapper.mapToErwinCurrentUser(account, user, undefined);

				expect(currentUser).toMatchObject({
					accountId,
					systemId: undefined,
					roles: [],
					schoolId: 'schoolId',
					userId: 'userId',
					isExternalUser: true,
				});
			});

			describe('when user has no ID', () => {
				const setup = () => {
					const user = {
						schoolId: 'schoolId',
						roles: [],
					} as unknown as UserDo;
					const account = {
						id: new ObjectId().toHexString(),
						userId: new ObjectId().toHexString(),
						systemId: undefined,
					} as Account;

					return { user, account };
				};

				it('should throw ValidationError', () => {
					const { user, account } = setup();

					expect(() => CurrentUserMapper.mapToErwinCurrentUser(account, user)).toThrow(ValidationError);
					expect(() => CurrentUserMapper.mapToErwinCurrentUser(account, user)).toThrow('user has no ID');
				});
			});

			describe('when user has no school ID', () => {
				const setup = () => {
					const user = {
						id: 'userId',
						roles: [],
					} as unknown as UserDo;
					const account = {
						id: new ObjectId().toHexString(),
						userId: new ObjectId().toHexString(),
						systemId: undefined,
					} as Account;

					return { user, account };
				};

				it('should throw ValidationError', () => {
					const { user, account } = setup();

					expect(() => CurrentUserMapper.mapToErwinCurrentUser(account, user)).toThrow(ValidationError);
					expect(() => CurrentUserMapper.mapToErwinCurrentUser(account, user)).toThrow('user has no school ID');
				});
			});
		});
	});
});
