import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserAlreadyAssignedToImportUserError } from '@shared/common';
import {
	ImportUser,
	MatchCreator,
	MatchCreatorScope,
	PermissionService,
	School,
	System,
	User,
	Account,
} from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { AccountRepo, ImportUserRepo, SchoolRepo, UserRepo } from '@shared/repo';
import { accountFactory, importUserFactory, schoolFactory, userFactory } from '@shared/testing';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UserImportPermissions } from '../constants';
import { UserImportUc } from './user-import.uc';

describe('[ImportUserModule]', () => {
	describe('UserUc', () => {
		let module: TestingModule;
		let uc: UserImportUc;
		let accountRepo: DeepMocked<AccountRepo>;
		let importUserRepo: ImportUserRepo;
		let schoolRepo: SchoolRepo;
		let userRepo: UserRepo;
		let permissionService: PermissionService;

		beforeAll(async () => {
			module = await Test.createTestingModule({
				imports: [MongoMemoryDatabaseModule.forRoot()],
				providers: [
					{
						provide: AccountRepo,
						useValue: createMock<AccountRepo>(),
					},
					UserImportUc,
					ImportUserRepo,
					SchoolRepo,
					UserRepo,
					{
						provide: PermissionService,
						useValue: {
							checkUserHasAllSchoolPermissions(): Promise<void> {
								throw new Error();
							},
						},
					},
				],
			}).compile();
			uc = module.get(UserImportUc); // TODO UserRepo not available in UserUc?!
			accountRepo = module.get(AccountRepo);
			importUserRepo = module.get(ImportUserRepo);
			schoolRepo = module.get(SchoolRepo);
			userRepo = module.get(UserRepo);
			permissionService = module.get(PermissionService);
		});

		afterAll(async () => {
			await module.close();
		});

		it('should be defined', () => {
			expect(uc).toBeDefined();
			expect(accountRepo).toBeDefined();
			expect(importUserRepo).toBeDefined();
			expect(schoolRepo).toBeDefined();
			expect(userRepo).toBeDefined();
			expect(permissionService).toBeDefined();
		});

		describe('[findAllImportUsers]', () => {
			it('Should request authorization service', async () => {
				const user = userFactory.buildWithId();
				const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
				const permissionServiceSpy = jest
					.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
					.mockReturnValue();
				const importUserRepoFindImportUsersSpy = jest
					.spyOn(importUserRepo, 'findImportUsers')
					.mockResolvedValueOnce([[], 0]);
				const result = await uc.findAllImportUsers(user.id, {}, {});
				expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
				expect(permissionServiceSpy).toHaveBeenCalledWith(user, [UserImportPermissions.SCHOOL_IMPORT_USERS_VIEW]);
				expect(importUserRepoFindImportUsersSpy).toHaveBeenCalledWith(user.school, {}, {});
				expect(result[0]).toHaveLength(0);
				expect(result[1]).toEqual(0);
				userRepoByIdSpy.mockRestore();
				permissionServiceSpy.mockRestore();
				importUserRepoFindImportUsersSpy.mockRestore();
			});
		});

		describe('[findAllUnmatchedUsers]', () => {
			it('Should request authorization service', async () => {
				const user = userFactory.buildWithId();
				const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
				const permissionServiceSpy = jest
					.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
					.mockReturnValue();
				const userRepoFindUnmatchedSpy = jest.spyOn(userRepo, 'findWithoutImportUser').mockResolvedValueOnce([[], 0]);
				const query = {};
				const [result, count] = await uc.findAllUnmatchedUsers(user.id, query);
				expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
				expect(permissionServiceSpy).toHaveBeenCalledWith(user, [UserImportPermissions.SCHOOL_IMPORT_USERS_VIEW]);
				expect(result.length).toEqual(0);
				expect(count).toEqual(0);
				userRepoByIdSpy.mockRestore();
				permissionServiceSpy.mockRestore();
				userRepoFindUnmatchedSpy.mockRestore();
			});
		});

		describe('[setMatch]', () => {
			describe('When not having same school for current user, user match and importuser', () => {
				it('should not change match', async () => {
					const school = schoolFactory.buildWithId();
					const user = userFactory.buildWithId();
					const importUser = importUserFactory.buildWithId({ school });
					const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
					const permissionServiceSpy = jest
						.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
						.mockReturnValue();
					const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
					const importUserPersistAndFlushSpy = jest
						.spyOn(importUserRepo, 'persistAndFlush')
						.mockResolvedValueOnce(importUser);

					await expect(async () => uc.setMatch(user.id, importUser.id, user.id)).rejects.toThrowError(
						ForbiddenException
					);
					expect(importUser.flagged).not.toEqual(true);
					userRepoByIdSpy.mockRestore();
					permissionServiceSpy.mockRestore();
					importUserRepoFindByIdSpy.mockRestore();
					importUserPersistAndFlushSpy.mockRestore();
				});
			});
			describe('When having same school for current user, user-match and importuser', () => {
				describe('When not having a user already assigned as match', () => {
					it('should set user as new match', async () => {
						const school = schoolFactory.buildWithId();
						const currentUser = userFactory.buildWithId({ school });
						const usermatch = userFactory.buildWithId({ school });
						const importUser = importUserFactory.buildWithId({ school });
						const userRepoByIdSpy = jest
							.spyOn(userRepo, 'findById')
							.mockResolvedValueOnce(currentUser)
							.mockResolvedValueOnce(usermatch);

						const permissionServiceSpy = jest
							.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
							.mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserRepoHasMatchdSpy = jest.spyOn(importUserRepo, 'hasMatch').mockResolvedValueOnce(null);

						const importUserPersistAndFlushSpy = jest
							.spyOn(importUserRepo, 'persistAndFlush')
							.mockResolvedValueOnce(importUser);

						expect(importUser.user).toBeUndefined();
						expect(importUser.matchedBy).toBeUndefined();

						await uc.setMatch(currentUser.id, importUser.id, usermatch.id);

						expect(userRepoByIdSpy).toHaveBeenCalledWith(currentUser.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [
							UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE,
						]);
						expect(importUserRepoHasMatchdSpy).toHaveBeenCalledWith(usermatch);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(importUser.user).toEqual(usermatch);
						expect(importUser.matchedBy).toEqual(MatchCreator.MANUAL);
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserRepoHasMatchdSpy.mockRestore();
						importUserPersistAndFlushSpy.mockRestore();
					});
				});

				describe('When having a user already assigned as match', () => {
					it('should not set user as new match twice', async () => {
						const school = schoolFactory.buildWithId();
						const currentUser = userFactory.buildWithId({ school });
						const usermatch = userFactory.buildWithId({ school });
						const importUser = importUserFactory.buildWithId({ school });
						const userRepoByIdSpy = jest
							.spyOn(userRepo, 'findById')
							.mockResolvedValueOnce(currentUser)
							.mockResolvedValueOnce(usermatch);

						const permissionServiceSpy = jest
							.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
							.mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const otherImportUser = importUserFactory.buildWithId();
						const importUserRepoHasMatchdSpy = jest
							.spyOn(importUserRepo, 'hasMatch')
							.mockResolvedValueOnce(otherImportUser);

						const importUserPersistAndFlushSpy = jest
							.spyOn(importUserRepo, 'persistAndFlush')
							.mockResolvedValueOnce(importUser);

						expect(importUser.user).toBeUndefined();
						expect(importUser.matchedBy).toBeUndefined();

						await expect(async () => uc.setMatch(currentUser.id, importUser.id, usermatch.id)).rejects.toThrowError(
							UserAlreadyAssignedToImportUserError
						);
						expect(userRepoByIdSpy).toHaveBeenCalledWith(currentUser.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [
							UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE,
						]);
						expect(importUserRepoHasMatchdSpy).toHaveBeenCalledWith(usermatch);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(importUser.user).not.toEqual(usermatch);
						expect(importUser.matchedBy).not.toEqual(MatchCreator.MANUAL);
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserRepoHasMatchdSpy.mockRestore();
						importUserPersistAndFlushSpy.mockRestore();
					});
				});
			});
		});

		describe('[setFlag]', () => {
			describe('When having permission UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE', () => {
				describe('When not having same school for user and importuser', () => {
					it('should not change flag', async () => {
						const school = schoolFactory.buildWithId();
						const user = userFactory.buildWithId();
						const importUser = importUserFactory.buildWithId({ school });
						const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
						const permissionServiceSpy = jest
							.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
							.mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserPersistAndFlushSpy = jest
							.spyOn(importUserRepo, 'persistAndFlush')
							.mockResolvedValueOnce(importUser);

						await expect(async () => uc.updateFlag(user.id, importUser.id, true)).rejects.toThrowError(
							ForbiddenException
						);
						expect(importUser.flagged).not.toEqual(true);
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserPersistAndFlushSpy.mockRestore();
					});
				});
				describe('When having same school for user and importuser', () => {
					it('should enable flag', async () => {
						const school = schoolFactory.buildWithId();
						const user = userFactory.buildWithId({ school });
						const importUser = importUserFactory.buildWithId({ school });
						const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
						const permissionServiceSpy = jest
							.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
							.mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserPersistAndFlushSpy = jest
							.spyOn(importUserRepo, 'persistAndFlush')
							.mockResolvedValueOnce(importUser);

						const result = await uc.updateFlag(user.id, importUser.id, true);

						expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE]);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(result).toBe(importUser);
						expect(importUser.flagged).toEqual(true);
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserPersistAndFlushSpy.mockRestore();
					});
					it('should disable flag', async () => {
						const school = schoolFactory.buildWithId();
						const user = userFactory.buildWithId({ school });
						const importUser = importUserFactory.buildWithId({ school });
						const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
						const permissionServiceSpy = jest
							.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
							.mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserPersistAndFlushSpy = jest
							.spyOn(importUserRepo, 'persistAndFlush')
							.mockResolvedValueOnce(importUser);

						const result = await uc.updateFlag(user.id, importUser.id, false);

						expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE]);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(result).toBe(importUser);
						expect(importUser.flagged).toEqual(false);
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserPersistAndFlushSpy.mockRestore();
					});
				});
			});
		});

		describe('[removeMatch]', () => {
			describe('When having permission UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE', () => {
				describe('When having same school for user and importuser', () => {
					it('should revoke match', async () => {
						const school = schoolFactory.buildWithId();
						const user = userFactory.buildWithId({ school });
						const importUser = importUserFactory.matched(MatchCreator.AUTO, user).buildWithId({ school });
						const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
						const permissionServiceSpy = jest
							.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
							.mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserPersistAndFlushSpy = jest
							.spyOn(importUserRepo, 'persistAndFlush')
							.mockResolvedValueOnce(importUser);

						expect(importUser.user).toBeDefined();
						expect(importUser.matchedBy).toBeDefined();

						const result = await uc.removeMatch(user.id, importUser.id);

						expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE]);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(result).toBe(importUser);
						expect(result.user).toBeUndefined();
						expect(result.matchedBy).toBeUndefined();
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserPersistAndFlushSpy.mockRestore();
					});
				});
				describe('When not having same school for user and importuser', () => {
					it('should not revoke match', async () => {
						const school = schoolFactory.buildWithId();
						const user = userFactory.buildWithId();
						const usermatch = userFactory.buildWithId({ school });
						const importUser = importUserFactory.matched(MatchCreator.AUTO, usermatch).buildWithId({ school });
						const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
						const permissionServiceSpy = jest
							.spyOn(permissionService, 'checkUserHasAllSchoolPermissions')
							.mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserPersistAndFlushSpy = jest
							.spyOn(importUserRepo, 'persistAndFlush')
							.mockResolvedValueOnce(importUser);

						expect(importUser.user).toBeDefined();
						expect(importUser.matchedBy).toBeDefined();

						await expect(async () => uc.removeMatch(user.id, importUser.id)).rejects.toThrowError(ForbiddenException);

						expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE]);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(importUser.user).toEqual(usermatch);
						expect(importUser.matchedBy).toEqual(MatchCreator.AUTO);
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserPersistAndFlushSpy.mockRestore();
					});
				});
			});
		});

		describe('[saveAllUsersMatches]', () => {
			let account: Account;
			let system: System;
			let school: School;
			let currentUser: User;
			let userMatch1: User;
			let userMatch2: User;
			let importUser1: ImportUser;
			let importUser2: ImportUser;
			let userRepoByIdSpy;
			let permissionServiceSpy;
			let importUserRepoFindImportUsersSpy;
			let importUserRepoDeleteImportUsersBySchoolSpy;
			let schoolRepoPersistSpy;
			let userRepoFlushSpy;
			let accountRepoFindByUserIdSpy;
			beforeEach(() => {
				system = systemFactory.buildWithId();
				school = schoolFactory.buildWithId({ systems: [system] });
				currentUser = userFactory.buildWithId({ school });
				account = accountFactory.buildWithId({ userId: currentUser._id });

				userMatch1 = userFactory.buildWithId({ school });
				userMatch2 = userFactory.buildWithId({ school });
				importUser1 = importUserFactory.buildWithId({
					school,
					user: userMatch1,
					matchedBy: MatchCreator.AUTO,
					system,
				});
				importUser2 = importUserFactory.buildWithId({
					school,
					user: userMatch2,
					matchedBy: MatchCreator.MANUAL,
					system,
				});
				userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValueOnce(currentUser);
				permissionServiceSpy = jest.spyOn(permissionService, 'checkUserHasAllSchoolPermissions').mockReturnValue();
				importUserRepoFindImportUsersSpy = jest.spyOn(importUserRepo, 'findImportUsers').mockResolvedValue([[], 0]);
				accountRepoFindByUserIdSpy = jest.spyOn(accountRepo, 'findOneByUser').mockResolvedValue(account);
				importUserRepoDeleteImportUsersBySchoolSpy = jest.spyOn(importUserRepo, 'deleteImportUsersBySchool');
				schoolRepoPersistSpy = jest
					.spyOn(schoolRepo, 'persistAndFlush')
					.mockReturnValueOnce(Promise.resolve({ ...school, inUserMigration: false }));
				userRepoFlushSpy = jest.spyOn(userRepo, 'flush').mockResolvedValueOnce();
			});
			afterEach(() => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				userRepoByIdSpy.mockRestore();
				permissionServiceSpy.mockRestore();
				importUserRepoFindImportUsersSpy.mockRestore();
				accountRepoFindByUserIdSpy.mockRestore();
				importUserRepoDeleteImportUsersBySchoolSpy.mockRestore();
				schoolRepoPersistSpy.mockRestore();
				userRepoFlushSpy.mockRestore();
			});
			it('Should request authorization service', async () => {
				await uc.saveAllUsersMatches(currentUser.id);

				expect(userRepoByIdSpy).toHaveBeenCalledWith(currentUser.id, true);
				expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [
					UserImportPermissions.SCHOOL_IMPORT_USERS_MIGRATE,
				]);
			});
			it('should save ldap info to user', async () => {
				importUserRepoFindImportUsersSpy = jest
					.spyOn(importUserRepo, 'findImportUsers')
					.mockResolvedValueOnce([[importUser1, importUser2], 2]);

				userMatch1.ldapId = importUser1.ldapId;
				userMatch2.ldapId = importUser2.ldapId;
				const userRepoPersistSpy = jest.spyOn(userRepo, 'persist').mockReturnValueOnce(userMatch1);

				await uc.saveAllUsersMatches(currentUser.id);

				const filters = { matches: [MatchCreatorScope.MANUAL, MatchCreatorScope.AUTO] };
				expect(importUserRepoFindImportUsersSpy).toHaveBeenCalledWith(school, filters, {});
				expect(userRepoPersistSpy).toHaveBeenCalledTimes(2);
				expect(userRepoPersistSpy.mock.calls).toEqual([[userMatch1], [userMatch2]]);
				expect(userRepoFlushSpy).toHaveBeenCalledTimes(1);
			});
			it('should remove import users for school', async () => {
				await uc.saveAllUsersMatches(currentUser.id);
				expect(importUserRepoDeleteImportUsersBySchoolSpy).toHaveBeenCalledWith(school);
			});
			it('should set inUserMigration to false for school', async () => {
				await uc.saveAllUsersMatches(currentUser.id);

				school.inUserMigration = false;
				expect(schoolRepoPersistSpy).toHaveBeenCalledWith(school);
			});
		});
	});
});
