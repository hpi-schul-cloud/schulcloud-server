import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userDoFactory, userFactory } from '@modules/user/testing';
import { ValidationError } from '@shared/common/error';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { ObjectId } from '@mikro-orm/mongodb';
import { OauthCurrentUser } from '../interface';
import { CurrentUserMapper } from './current-user.mapper';
import { Account } from '@modules/account/domain/do/account';

describe('CurrentUserMapper', () => {
	beforeAll(async () => {
		await setupEntities([User]);
	});

	describe('extractRoleIds', () => {
		it('should return empty array if roles is undefined', () => {
			const roles: string[] = (
				CurrentUserMapper as unknown as { extractRoleIds: (input: Record<string, unknown>) => string[] }
			).extractRoleIds({});
			expect(roles).toEqual([]);
		});

		it('should ignore roles that are not objects or missing id', () => {
			const roles: string[] = (
				CurrentUserMapper as unknown as { extractRoleIds: (input: Record<string, unknown>) => string[] }
			).extractRoleIds({ roles: [null, undefined, 123, {}, { foo: 'bar' }] });
			expect(roles).toEqual([]);
		});

		it('should handle roles as array of objects with id', () => {
			const roles: string[] = (
				CurrentUserMapper as unknown as { extractRoleIds: (input: Record<string, unknown>) => string[] }
			).extractRoleIds({ roles: [{ id: 'r1' }, { id: 'r2' }] });
			expect(roles).toEqual(['r1', 'r2']);
		});

		it('should handle roles as object with getItems function', () => {
			const roles: string[] = (
				CurrentUserMapper as unknown as { extractRoleIds: (input: Record<string, unknown>) => string[] }
			).extractRoleIds({
				roles: { getItems: () => [{ id: 'r3' }, { id: 'r4' }] },
			});
			expect(roles).toEqual(['r3', 'r4']);
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

			describe('when user has no ID', () => {
				const setup = () => {
					const user = {
						school: schoolEntityFactory.buildWithId(),
						roles: [],
					};
					const accountId = new ObjectId().toHexString();

					return {
						user,
						accountId,
					};
				};

				it('should throw ValidationError', () => {
					const { accountId, user } = setup();

					expect(() => CurrentUserMapper.userToICurrentUser(accountId, user, false)).toThrow(ValidationError);
					expect(() => CurrentUserMapper.userToICurrentUser(accountId, user, false)).toThrow('user has no ID');
				});
			});

			describe('when user has no school ID', () => {
				const setup = () => {
					const user = {
						id: new ObjectId().toHexString(),
						school: {},
						roles: [],
					};
					const accountId = new ObjectId().toHexString();

					return {
						user,
						accountId,
					};
				};

				it('should throw ValidationError', () => {
					const { accountId, user } = setup();

					expect(() => CurrentUserMapper.userToICurrentUser(accountId, user, false)).toThrow(ValidationError);
					expect(() => CurrentUserMapper.userToICurrentUser(accountId, user, false)).toThrow('user has no school ID');
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
					const user = userFactory.buildWithId({
						roles: [teacherRole],
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
						schoolId: user.school.id,
						isExternalUser: false,
					});
				});
			});

			describe('when user has no roles', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
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
						schoolId: user.school.id,
						isExternalUser: false,
					});
				});
			});

			describe('when systemId is provided', () => {
				const setup = () => {
					const user = userFactory.buildWithId({
						school: schoolEntityFactory.buildWithId(),
					});
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
						schoolId: user.school.id,
						isExternalUser: false,
					});
				});
			});

			describe('when user has schoolId property', () => {
				const setup = () => {
					const user = {
						id: 'mockUserId',
						schoolId: 'mockSchoolId',
						roles: [],
					};
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
						userId: 'mockUserId',
						isExternalUser: false,
					});
				});
			});

			describe('when roles is a collection with getItems', () => {
				const setup = () => {
					const user = {
						id: 'mockUserId',
						school: { id: 'mockSchoolId' },
						roles: {
							getItems: () => [{ id: 'mockRoleId1' }, { id: 'mockRoleId2' }],
						},
					};
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

				it('should map roles using getItems()', () => {
					const { account, user } = setup();

					const currentUser = CurrentUserMapper.mapToErwinCurrentUser(account, user, undefined, false);
					const accountId = account.id;

					expect(currentUser).toMatchObject({
						accountId,
						systemId: undefined,
						roles: ['mockRoleId1', 'mockRoleId2'],
						schoolId: 'mockSchoolId',
						userId: 'mockUserId',
						isExternalUser: false,
					});
				});
			});

			describe('when isExternalUser is not provided', () => {
				const setup = () => {
					const user = userFactory.buildWithId();
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
				const user = {
					id: 'userId',
					school: { id: 'schoolId' },
					roles: [],
				};

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
				const user = {
					id: 'userId',
					school: { id: 'schoolId' },
					roles: [],
					externalId: 'erwinExternalId',
				};
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
				const user = {
					id: 'userId',
					school: { id: 'schoolId' },
					roles: [],
				};
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
				const user = {
					id: 'userId',
					school: { id: 'schoolId' },
					roles: [],
					externalId: 'erwinExternalId',
				};
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
					};
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
					};
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
