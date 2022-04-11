import { BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserAlreadyAssignedToImportUserError } from '@shared/common';
import {
	Account,
	ImportUser,
	MatchCreator,
	MatchCreatorScope,
	PermissionService,
	School,
	System,
	User,
} from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { AccountRepo, ImportUserRepo, SchoolRepo, SystemRepo, UserRepo } from '@shared/repo';
import { accountFactory, importUserFactory, schoolFactory, userFactory } from '@shared/testing';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { ObjectId } from '@mikro-orm/mongodb';
import { UserImportPermissions } from '../constants';
import { UserImportUc } from './user-import.uc';

describe('[ImportUserModule]', () => {
	describe('UserUc', () => {
		let module: TestingModule;
		let uc: UserImportUc;
		let accountRepo: DeepMocked<AccountRepo>;
		let importUserRepo: DeepMocked<ImportUserRepo>;
		let schoolRepo: DeepMocked<SchoolRepo>;
		let systemRepo: DeepMocked<SystemRepo>;
		let userRepo: DeepMocked<UserRepo>;
		let permissionService: DeepMocked<PermissionService>;
		let configurationSpy: jest.SpyInstance;

		beforeAll(async () => {
			module = await Test.createTestingModule({
				imports: [MongoMemoryDatabaseModule.forRoot()],
				providers: [
					{
						provide: AccountRepo,
						useValue: createMock<AccountRepo>(),
					},
					UserImportUc,
					{
						provide: ImportUserRepo,
						useValue: createMock<ImportUserRepo>(),
					},
					{
						provide: SchoolRepo,
						useValue: createMock<SchoolRepo>(),
					},
					{
						provide: SystemRepo,
						useValue: createMock<SystemRepo>(),
					},
					{
						provide: UserRepo,
						useValue: createMock<UserRepo>(),
					},
					{
						provide: PermissionService,
						useValue: createMock<PermissionService>(),
					},
				],
			}).compile();
			uc = module.get(UserImportUc); // TODO UserRepo not available in UserUc?!
			accountRepo = module.get(AccountRepo);
			importUserRepo = module.get(ImportUserRepo);
			schoolRepo = module.get(SchoolRepo);
			systemRepo = module.get(SystemRepo);
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
			expect(systemRepo).toBeDefined();
			expect(userRepo).toBeDefined();
			expect(permissionService).toBeDefined();
		});

		const setConfig = (systemId?: string) => {
			const mockSystemId = systemId || new ObjectId().toString();
			configurationSpy = jest.spyOn(Configuration, 'get').mockImplementation((config: string) => {
				if (config === 'FEATURE_USER_MIGRATION_SYSTEM_ID') {
					return mockSystemId;
				}
				if (config === 'FEATURE_USER_MIGRATION_ENABLED') {
					return true;
				}
				return null;
			});
		};

		beforeEach(() => {
			setConfig();
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
					const importUserSaveSpy = jest.spyOn(importUserRepo, 'save').mockResolvedValueOnce();

					await expect(async () => uc.setMatch(user.id, importUser.id, user.id)).rejects.toThrowError(
						ForbiddenException
					);
					expect(importUser.flagged).not.toEqual(true);
					userRepoByIdSpy.mockRestore();
					permissionServiceSpy.mockRestore();
					importUserRepoFindByIdSpy.mockRestore();
					importUserSaveSpy.mockRestore();
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

						const importUserSaveSpy = jest.spyOn(importUserRepo, 'save').mockResolvedValueOnce();

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
						importUserSaveSpy.mockRestore();
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

						const importUserSaveSpy = jest.spyOn(importUserRepo, 'save').mockResolvedValueOnce();

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
						importUserSaveSpy.mockRestore();
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
						const importUserSaveSpy = jest.spyOn(importUserRepo, 'save').mockResolvedValueOnce();

						await expect(async () => uc.updateFlag(user.id, importUser.id, true)).rejects.toThrowError(
							ForbiddenException
						);
						expect(importUser.flagged).not.toEqual(true);
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserSaveSpy.mockRestore();
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
						const importUserSaveSpy = jest.spyOn(importUserRepo, 'save').mockResolvedValueOnce();

						const result = await uc.updateFlag(user.id, importUser.id, true);

						expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE]);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(result).toBe(importUser);
						expect(importUser.flagged).toEqual(true);
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserSaveSpy.mockRestore();
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
						const importUserSaveSpy = jest.spyOn(importUserRepo, 'save').mockResolvedValueOnce();

						const result = await uc.updateFlag(user.id, importUser.id, false);

						expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [UserImportPermissions.SCHOOL_IMPORT_USERS_UPDATE]);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(result).toBe(importUser);
						expect(importUser.flagged).toEqual(false);
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserSaveSpy.mockRestore();
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
						const importUserSaveSpy = jest.spyOn(importUserRepo, 'save').mockResolvedValueOnce();

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
						importUserSaveSpy.mockRestore();
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
						const importUserSaveSpy = jest.spyOn(importUserRepo, 'save').mockResolvedValueOnce();

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
						importUserSaveSpy.mockRestore();
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
			let importUser3: ImportUser;
			let userRepoByIdSpy: jest.SpyInstance;
			let permissionServiceSpy: jest.SpyInstance;
			let importUserRepoFindImportUsersSpy: jest.SpyInstance;
			let importUserRepoDeleteImportUsersBySchoolSpy: jest.SpyInstance;
			let schoolRepoSaveSpy: jest.SpyInstance;
			let userRepoFlushSpy: jest.SpyInstance;
			let accountRepoFindByUserIdSpy: jest.SpyInstance;
			beforeEach(() => {
				system = systemFactory.buildWithId();
				school = schoolFactory.buildWithId({ systems: [system] });
				school.ldapSchoolIdentifier = 'foo';
				school.inMaintenanceSince = new Date();
				school.inUserMigration = true;
				school.officialSchoolNumber = 'foo';

				currentUser = userFactory.buildWithId({ school });
				account = accountFactory.buildWithId({ user: currentUser });

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
				importUser3 = importUserFactory.buildWithId({
					school,
					matchedBy: MatchCreator.MANUAL,
					system,
				});
				userRepoByIdSpy = userRepo.findById.mockResolvedValue(currentUser);
				userRepoFlushSpy = userRepo.flush.mockResolvedValueOnce();
				permissionServiceSpy = permissionService.checkUserHasAllSchoolPermissions.mockReturnValue();
				importUserRepoFindImportUsersSpy = importUserRepo.findImportUsers.mockResolvedValue([[], 0]);
				accountRepoFindByUserIdSpy = accountRepo.findOneByUser.mockResolvedValue(account);
				importUserRepoDeleteImportUsersBySchoolSpy = importUserRepo.deleteImportUsersBySchool.mockResolvedValue();
				schoolRepoSaveSpy = schoolRepo.save.mockReturnValueOnce(Promise.resolve());
			});
			afterEach(() => {
				userRepoByIdSpy.mockRestore();
				permissionServiceSpy.mockRestore();
				importUserRepoFindImportUsersSpy.mockRestore();
				accountRepoFindByUserIdSpy.mockRestore();
				importUserRepoDeleteImportUsersBySchoolSpy.mockRestore();
				schoolRepoSaveSpy.mockRestore();
				userRepoFlushSpy.mockRestore();
			});
			it('Should request authorization service', async () => {
				await uc.saveAllUsersMatches(currentUser.id);

				expect(userRepoByIdSpy).toHaveBeenCalledWith(currentUser.id, true);
				expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [
					UserImportPermissions.SCHOOL_IMPORT_USERS_MIGRATE,
				]);
			});
			it('should not save ldap info to user if missing mandatory fields', async () => {
				importUserRepoFindImportUsersSpy = jest
					.spyOn(importUserRepo, 'findImportUsers')
					.mockResolvedValueOnce([[importUser1, importUser2, importUser3], 3]);

				const userRepoSaveWithoutFlushSpy = jest.spyOn(userRepo, 'saveWithoutFlush');

				await uc.saveAllUsersMatches(currentUser.id);
				expect(userRepoSaveWithoutFlushSpy).toHaveBeenCalledTimes(2);
				userRepoSaveWithoutFlushSpy.mockRestore();
			});
			it('should save ldap info to user', async () => {
				importUserRepoFindImportUsersSpy = jest
					.spyOn(importUserRepo, 'findImportUsers')
					.mockResolvedValueOnce([[importUser1, importUser2], 2]);

				userMatch1.ldapId = importUser1.ldapId;
				userMatch2.ldapId = importUser2.ldapId;
				const userRepoSaveWithoutFlushSpy = jest.spyOn(userRepo, 'saveWithoutFlush').mockReturnValue();

				await uc.saveAllUsersMatches(currentUser.id);

				const filters = { matches: [MatchCreatorScope.MANUAL, MatchCreatorScope.AUTO] };
				expect(importUserRepoFindImportUsersSpy).toHaveBeenCalledWith(school, filters, {});
				expect(userRepoSaveWithoutFlushSpy).toHaveBeenCalledTimes(2);
				expect(userRepoSaveWithoutFlushSpy.mock.calls).toEqual([[userMatch1], [userMatch2]]);
				expect(userRepoFlushSpy).toHaveBeenCalledTimes(1);
				userRepoSaveWithoutFlushSpy.mockRestore();
			});
			it('should remove import users for school', async () => {
				await uc.saveAllUsersMatches(currentUser.id);
				expect(importUserRepoDeleteImportUsersBySchoolSpy).toHaveBeenCalledWith(school);
			});
			it('should throw if school data is inconsistent', async () => {
				school.ldapSchoolIdentifier = undefined;
				currentUser = userFactory.buildWithId({ school });
				const result2 = () => uc.saveAllUsersMatches(currentUser.id);
				await expect(result2).rejects.toThrowError(BadRequestException);

				school.inUserMigration = undefined;
				currentUser = userFactory.buildWithId({ school });
				const result3 = () => uc.saveAllUsersMatches(currentUser.id);
				await expect(result3).rejects.toThrowError(BadRequestException);

				school.inMaintenanceSince = new Date();
				currentUser = userFactory.buildWithId({ school });
				const result4 = () => uc.saveAllUsersMatches(currentUser.id);
				await expect(result4).rejects.toThrowError(BadRequestException);
			});
		});

		describe('[startSchoolInUserMigration]', () => {
			let system: System;
			let school: School;
			let currentUser: User;
			let userRepoByIdSpy: jest.SpyInstance;
			let permissionServiceSpy: jest.SpyInstance;
			let schoolRepoSaveSpy: jest.SpyInstance;
			let systemRepoSpy: jest.SpyInstance;
			const currentDate = new Date('2022-03-10T00:00:00.000Z');
			let dateSpy: jest.SpyInstance;
			beforeEach(() => {
				system = systemFactory.buildWithId();
				school = schoolFactory.buildWithId();
				school.officialSchoolNumber = 'foo';
				currentUser = userFactory.buildWithId({ school });
				userRepoByIdSpy = userRepo.findById.mockResolvedValueOnce(currentUser);
				permissionServiceSpy = permissionService.checkUserHasAllSchoolPermissions.mockReturnValue();
				schoolRepoSaveSpy = schoolRepo.save.mockReturnValueOnce(Promise.resolve());
				systemRepoSpy = systemRepo.findById.mockReturnValueOnce(Promise.resolve(system));
				setConfig(system.id);
				dateSpy = jest.spyOn(global, 'Date').mockReturnValue(currentDate as unknown as string);
			});
			afterEach(() => {
				userRepoByIdSpy.mockRestore();
				permissionServiceSpy.mockRestore();
				schoolRepoSaveSpy.mockRestore();
				systemRepoSpy.mockRestore();
				configurationSpy.mockRestore();
				dateSpy.mockRestore();
			});
			it('Should fetch system id from configuration', async () => {
				await uc.startSchoolInUserMigration(currentUser.id);

				expect(configurationSpy).toHaveBeenCalledWith('FEATURE_USER_MIGRATION_SYSTEM_ID');
				expect(systemRepoSpy).toHaveBeenCalledWith(system.id);
			});
			it('Should request authorization service', async () => {
				await uc.startSchoolInUserMigration(currentUser.id);

				expect(userRepoByIdSpy).toHaveBeenCalledWith(currentUser.id, true);
				expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [
					UserImportPermissions.SCHOOL_IMPORT_USERS_MIGRATE,
				]);
			});
			it('Should save school params', async () => {
				await uc.startSchoolInUserMigration(currentUser.id);

				const schoolParams = { ...school };
				schoolParams.inUserMigration = true;
				schoolParams.ldapSchoolIdentifier = 'foo';
				schoolParams.inMaintenanceSince = currentDate;
				schoolParams.systems.add(system);
				expect(schoolRepoSaveSpy).toHaveBeenCalledWith(schoolParams);
			});
			it('should throw if system id from configuration is wrong format', async () => {
				configurationSpy = jest.spyOn(Configuration, 'get').mockReturnValue('foo');
				const result = uc.startSchoolInUserMigration(currentUser.id);
				await expect(result).rejects.toThrowError(InternalServerErrorException);
			});
		});

		describe('[endSchoolMaintenance]', () => {
			let school: School;
			let currentUser: User;
			let userRepoByIdSpy: jest.SpyInstance;
			let permissionServiceSpy: jest.SpyInstance;
			let schoolRepoSaveSpy: jest.SpyInstance;
			beforeEach(() => {
				school = schoolFactory.buildWithId();
				school.ldapSchoolIdentifier = 'foo';
				school.inMaintenanceSince = new Date();
				school.inUserMigration = false;
				school.officialSchoolNumber = 'foo';
				currentUser = userFactory.buildWithId({ school });

				userRepoByIdSpy = userRepo.findById.mockResolvedValueOnce(currentUser);
				permissionServiceSpy = permissionService.checkUserHasAllSchoolPermissions.mockReturnValue();
				schoolRepoSaveSpy = schoolRepo.save.mockReturnValue(Promise.resolve());
			});
			afterEach(() => {
				userRepoByIdSpy.mockRestore();
				permissionServiceSpy.mockRestore();
				schoolRepoSaveSpy.mockRestore();
			});
			it('Should request authorization service', async () => {
				await uc.endSchoolInMaintenance(currentUser.id);

				expect(userRepoByIdSpy).toHaveBeenCalledWith(currentUser.id, true);
				expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [
					UserImportPermissions.SCHOOL_IMPORT_USERS_MIGRATE,
				]);
			});
			it('should remove inMaitenanceSince for school', async () => {
				await uc.endSchoolInMaintenance(currentUser.id);
				const school2 = { ...school, inMaintenanceSince: undefined };
				expect(schoolRepoSaveSpy).toHaveBeenCalledWith(school2);
			});
			it('should throw if school is missing ldapSchoolIdenfitier', async () => {
				school.ldapSchoolIdentifier = undefined;
				currentUser = userFactory.buildWithId({ school });
				const result1 = () => uc.endSchoolInMaintenance(currentUser.id);
				await expect(result1).rejects.toThrowError(BadRequestException);
			});
			it('should throw if school is missing inMaintenanceSince', async () => {
				school.inMaintenanceSince = undefined;
				currentUser = userFactory.buildWithId({ school });
				const result3 = () => uc.endSchoolInMaintenance(currentUser.id);
				await expect(result3).rejects.toThrowError(BadRequestException);
			});
			it('should throw if school is still inUserMigration mode', async () => {
				school.inUserMigration = true;
				currentUser = userFactory.buildWithId({ school });
				const result4 = () => uc.endSchoolInMaintenance(currentUser.id);
				await expect(result4).rejects.toThrowError(BadRequestException);
			});
		});
	});
});
