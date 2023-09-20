import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { ObjectId } from '@mikro-orm/mongodb';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UserAlreadyAssignedToImportUserError } from '@shared/common';
import {
	ImportUser,
	LegacySchoolDo,
	MatchCreator,
	MatchCreatorScope,
	Permission,
	SchoolEntity,
	SchoolFeatures,
	System,
	User,
} from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { ImportUserRepo, SystemRepo, UserRepo } from '@shared/repo';
import { federalStateFactory, importUserFactory, schoolFactory, userFactory } from '@shared/testing';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { LoggerModule } from '@src/core/logger';
import { AccountService } from '@src/modules/account/services/account.service';
import { AuthorizationService } from '@src/modules/authorization';
import { LegacySchoolService } from '@src/modules/legacy-school';
import {
	LdapAlreadyPersistedException,
	MigrationAlreadyActivatedException,
	MissingSchoolNumberException,
} from './ldap-user-migration.error';
import { UserImportUc } from './user-import.uc';

describe('[ImportUserModule]', () => {
	describe('UserUc', () => {
		let module: TestingModule;
		let uc: UserImportUc;
		let accountService: DeepMocked<AccountService>;
		let importUserRepo: DeepMocked<ImportUserRepo>;
		let schoolService: DeepMocked<LegacySchoolService>;
		let systemRepo: DeepMocked<SystemRepo>;
		let userRepo: DeepMocked<UserRepo>;
		let authorizationService: DeepMocked<AuthorizationService>;
		let configurationSpy: jest.SpyInstance;

		beforeAll(async () => {
			module = await Test.createTestingModule({
				imports: [
					MongoMemoryDatabaseModule.forRoot(),
					LoggerModule,
					ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, ignoreEnvVars: true }),
				],
				providers: [
					{
						provide: AccountService,
						useValue: createMock<AccountService>(),
					},
					UserImportUc,
					{
						provide: ImportUserRepo,
						useValue: createMock<ImportUserRepo>(),
					},
					{
						provide: LegacySchoolService,
						useValue: createMock<LegacySchoolService>(),
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
						provide: AuthorizationService,
						useValue: createMock<AuthorizationService>(),
					},
				],
			}).compile();
			uc = module.get(UserImportUc); // TODO UserRepo not available in UserUc?!
			accountService = module.get(AccountService);
			importUserRepo = module.get(ImportUserRepo);
			schoolService = module.get(LegacySchoolService);
			systemRepo = module.get(SystemRepo);
			userRepo = module.get(UserRepo);
			authorizationService = module.get(AuthorizationService);
		});

		afterAll(async () => {
			await module.close();
		});

		it('should be defined', () => {
			expect(uc).toBeDefined();
			expect(accountService).toBeDefined();
			expect(importUserRepo).toBeDefined();
			expect(schoolService).toBeDefined();
			expect(systemRepo).toBeDefined();
			expect(userRepo).toBeDefined();
			expect(authorizationService).toBeDefined();
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

		const createMockSchoolDo = (school?: SchoolEntity): LegacySchoolDo => {
			const name = school ? school.name : 'testSchool';
			const id = school ? school.id : 'someId';
			const features = school ? school.features ?? [SchoolFeatures.LDAP_UNIVENTION_MIGRATION] : [];
			const externalId = school ? school.externalId : undefined;
			const officialSchoolNumber = school ? school.officialSchoolNumber : undefined;
			const inMaintenanceSince = school ? school.inMaintenanceSince : undefined;
			const inUserMigration = school ? school.inUserMigration : undefined;
			const systems =
				school && school.systems.isInitialized() ? school.systems.getItems().map((system: System) => system.id) : [];
			const federalState = school ? school.federalState : federalStateFactory.build();

			return new LegacySchoolDo({
				id,
				name,
				features,
				externalId,
				officialSchoolNumber,
				inMaintenanceSince,
				inUserMigration,
				systems,
				federalState,
			});
		};

		beforeEach(() => {
			setConfig();
		});

		describe('[findAllImportUsers]', () => {
			it('Should request authorization service', async () => {
				const user = userFactory.buildWithId();
				const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
				const schoolServiceSpy = jest.spyOn(schoolService, 'getSchoolById').mockResolvedValue(createMockSchoolDo());
				const permissionServiceSpy = jest.spyOn(authorizationService, 'checkAllPermissions').mockReturnValue();
				const importUserRepoFindImportUsersSpy = jest
					.spyOn(importUserRepo, 'findImportUsers')
					.mockResolvedValueOnce([[], 0]);
				const result = await uc.findAllImportUsers(user.id, {}, {});
				expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
				expect(permissionServiceSpy).toHaveBeenCalledWith(user, [Permission.SCHOOL_IMPORT_USERS_VIEW]);
				expect(importUserRepoFindImportUsersSpy).toHaveBeenCalledWith(user.school, {}, {});
				expect(result[0]).toHaveLength(0);
				expect(result[1]).toEqual(0);
				expect(schoolServiceSpy).toHaveBeenCalledWith(user.school.id);
				schoolServiceSpy.mockRestore();
				userRepoByIdSpy.mockRestore();
				permissionServiceSpy.mockRestore();
				importUserRepoFindImportUsersSpy.mockRestore();
			});
		});

		describe('[findAllUnmatchedUsers]', () => {
			it('Should request authorization service', async () => {
				const user = userFactory.buildWithId();
				const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
				const schoolServiceSpy = jest.spyOn(schoolService, 'getSchoolById').mockResolvedValue(createMockSchoolDo());
				const permissionServiceSpy = jest.spyOn(authorizationService, 'checkAllPermissions').mockReturnValue();
				const userRepoFindUnmatchedSpy = jest.spyOn(userRepo, 'findWithoutImportUser').mockResolvedValueOnce([[], 0]);
				const query = {};
				const [result, count] = await uc.findAllUnmatchedUsers(user.id, query);
				expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
				expect(permissionServiceSpy).toHaveBeenCalledWith(user, [Permission.SCHOOL_IMPORT_USERS_VIEW]);
				expect(result.length).toEqual(0);
				expect(count).toEqual(0);
				expect(schoolServiceSpy).toHaveBeenCalledWith(user.school.id);
				schoolServiceSpy.mockRestore();
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
					const schoolServiceSpy = jest
						.spyOn(schoolService, 'getSchoolById')
						.mockResolvedValue(createMockSchoolDo(school));
					const permissionServiceSpy = jest.spyOn(authorizationService, 'checkAllPermissions').mockReturnValue();
					const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
					const importUserSaveSpy = jest.spyOn(importUserRepo, 'save').mockResolvedValueOnce();

					await expect(async () => uc.setMatch(user.id, importUser.id, user.id)).rejects.toThrowError(
						ForbiddenException
					);
					expect(importUser.flagged).not.toEqual(true);
					expect(schoolServiceSpy).toHaveBeenCalledWith(user.school.id);
					schoolServiceSpy.mockRestore();
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
						const schoolServiceSpy = jest
							.spyOn(schoolService, 'getSchoolById')
							.mockResolvedValue(createMockSchoolDo(school));
						const userRepoByIdSpy = jest
							.spyOn(userRepo, 'findById')
							.mockResolvedValueOnce(currentUser)
							.mockResolvedValueOnce(usermatch);

						const permissionServiceSpy = jest.spyOn(authorizationService, 'checkAllPermissions').mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserRepoHasMatchdSpy = jest.spyOn(importUserRepo, 'hasMatch').mockResolvedValueOnce(null);

						const importUserSaveSpy = jest.spyOn(importUserRepo, 'save').mockResolvedValueOnce();

						expect(importUser.user).toBeUndefined();
						expect(importUser.matchedBy).toBeUndefined();

						await uc.setMatch(currentUser.id, importUser.id, usermatch.id);

						expect(userRepoByIdSpy).toHaveBeenCalledWith(currentUser.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [Permission.SCHOOL_IMPORT_USERS_UPDATE]);
						expect(importUserRepoHasMatchdSpy).toHaveBeenCalledWith(usermatch);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(importUser.user).toEqual(usermatch);
						expect(importUser.matchedBy).toEqual(MatchCreator.MANUAL);
						expect(schoolServiceSpy).toHaveBeenCalledWith(currentUser.school.id);
						schoolServiceSpy.mockRestore();
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
						const schoolServiceSpy = jest
							.spyOn(schoolService, 'getSchoolById')
							.mockResolvedValue(createMockSchoolDo(school));
						const userRepoByIdSpy = jest
							.spyOn(userRepo, 'findById')
							.mockResolvedValueOnce(currentUser)
							.mockResolvedValueOnce(usermatch);

						const permissionServiceSpy = jest.spyOn(authorizationService, 'checkAllPermissions').mockReturnValue();
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
						expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [Permission.SCHOOL_IMPORT_USERS_UPDATE]);
						expect(importUserRepoHasMatchdSpy).toHaveBeenCalledWith(usermatch);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(importUser.user).not.toEqual(usermatch);
						expect(importUser.matchedBy).not.toEqual(MatchCreator.MANUAL);
						expect(schoolServiceSpy).toHaveBeenCalledWith(currentUser.school.id);
						schoolServiceSpy.mockRestore();
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
			describe('When having permission Permission.SCHOOL_IMPORT_USERS_UPDATE', () => {
				describe('When not having same school for user and importuser', () => {
					it('should not change flag', async () => {
						const school = schoolFactory.buildWithId();
						const user = userFactory.buildWithId();
						const importUser = importUserFactory.buildWithId({ school });
						const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
						const permissionServiceSpy = jest.spyOn(authorizationService, 'checkAllPermissions').mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserSaveSpy = jest.spyOn(importUserRepo, 'save').mockResolvedValueOnce();
						const schoolServiceSpy = jest.spyOn(schoolService, 'getSchoolById').mockResolvedValue(createMockSchoolDo());

						await expect(async () => uc.updateFlag(user.id, importUser.id, true)).rejects.toThrowError(
							ForbiddenException
						);
						expect(importUser.flagged).not.toEqual(true);
						expect(schoolServiceSpy).toHaveBeenCalledWith(user.school.id);
						schoolServiceSpy.mockRestore();
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
						const schoolServiceSpy = jest
							.spyOn(schoolService, 'getSchoolById')
							.mockResolvedValue(createMockSchoolDo(school));
						const permissionServiceSpy = jest.spyOn(authorizationService, 'checkAllPermissions').mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserSaveSpy = jest.spyOn(importUserRepo, 'save').mockResolvedValueOnce();

						const result = await uc.updateFlag(user.id, importUser.id, true);

						expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [Permission.SCHOOL_IMPORT_USERS_UPDATE]);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(result).toBe(importUser);
						expect(importUser.flagged).toEqual(true);
						expect(schoolServiceSpy).toHaveBeenCalledWith(user.school.id);
						schoolServiceSpy.mockRestore();
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
						const schoolServiceSpy = jest
							.spyOn(schoolService, 'getSchoolById')
							.mockResolvedValue(createMockSchoolDo(school));
						const permissionServiceSpy = jest.spyOn(authorizationService, 'checkAllPermissions').mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserSaveSpy = jest.spyOn(importUserRepo, 'save').mockResolvedValueOnce();

						const result = await uc.updateFlag(user.id, importUser.id, false);

						expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [Permission.SCHOOL_IMPORT_USERS_UPDATE]);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(result).toBe(importUser);
						expect(importUser.flagged).toEqual(false);
						expect(schoolServiceSpy).toHaveBeenCalledWith(user.school.id);
						schoolServiceSpy.mockRestore();
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserSaveSpy.mockRestore();
					});
				});
			});
		});

		describe('[removeMatch]', () => {
			describe('When having permission Permission.SCHOOL_IMPORT_USERS_UPDATE', () => {
				describe('When having same school for user and importuser', () => {
					it('should revoke match', async () => {
						const school = schoolFactory.buildWithId();
						const user = userFactory.buildWithId({ school });
						const importUser = importUserFactory.matched(MatchCreator.AUTO, user).buildWithId({ school });
						const schoolServiceSpy = jest
							.spyOn(schoolService, 'getSchoolById')
							.mockResolvedValue(createMockSchoolDo(school));
						const userRepoByIdSpy = jest.spyOn(userRepo, 'findById').mockResolvedValue(user);
						const permissionServiceSpy = jest.spyOn(authorizationService, 'checkAllPermissions').mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserSaveSpy = jest.spyOn(importUserRepo, 'save').mockResolvedValueOnce();

						expect(importUser.user).toBeDefined();
						expect(importUser.matchedBy).toBeDefined();

						const result = await uc.removeMatch(user.id, importUser.id);

						expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [Permission.SCHOOL_IMPORT_USERS_UPDATE]);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(result).toBe(importUser);
						expect(result.user).toBeUndefined();
						expect(result.matchedBy).toBeUndefined();
						expect(schoolServiceSpy).toHaveBeenCalledWith(user.school.id);
						schoolServiceSpy.mockRestore();
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
						const schoolServiceSpy = jest.spyOn(schoolService, 'getSchoolById').mockResolvedValue(createMockSchoolDo());
						const permissionServiceSpy = jest.spyOn(authorizationService, 'checkAllPermissions').mockReturnValue();
						const importUserRepoFindByIdSpy = jest.spyOn(importUserRepo, 'findById').mockResolvedValueOnce(importUser);
						const importUserSaveSpy = jest.spyOn(importUserRepo, 'save').mockResolvedValueOnce();

						expect(importUser.user).toBeDefined();
						expect(importUser.matchedBy).toBeDefined();

						await expect(async () => uc.removeMatch(user.id, importUser.id)).rejects.toThrowError(ForbiddenException);

						expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [Permission.SCHOOL_IMPORT_USERS_UPDATE]);
						expect(importUserRepoFindByIdSpy).toHaveBeenCalledWith(importUser.id);
						expect(importUser.user).toEqual(usermatch);
						expect(importUser.matchedBy).toEqual(MatchCreator.AUTO);
						expect(schoolServiceSpy).toHaveBeenCalledWith(user.school.id);
						schoolServiceSpy.mockRestore();
						userRepoByIdSpy.mockRestore();
						permissionServiceSpy.mockRestore();
						importUserRepoFindByIdSpy.mockRestore();
						importUserSaveSpy.mockRestore();
					});
				});
			});
		});

		describe('[saveAllUsersMatches]', () => {
			let system: System;
			let school: SchoolEntity;
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
			let importUserRepoDeleteImportUserSpy: jest.SpyInstance;
			let schoolServiceSaveSpy: jest.SpyInstance;
			let schoolServiceSpy: jest.SpyInstance;
			let userRepoFlushSpy: jest.SpyInstance;
			let accountServiceFindByUserIdSpy: jest.SpyInstance;
			beforeEach(() => {
				system = systemFactory.buildWithId();
				school = schoolFactory.buildWithId({ systems: [system] });
				school.externalId = 'foo';
				school.inMaintenanceSince = new Date();
				school.inUserMigration = true;
				school.officialSchoolNumber = 'foo';

				currentUser = userFactory.buildWithId({ school });

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
				schoolServiceSpy = schoolService.getSchoolById.mockResolvedValue(createMockSchoolDo(school));
				userRepoFlushSpy = userRepo.flush.mockResolvedValueOnce();
				permissionServiceSpy = authorizationService.checkAllPermissions.mockReturnValue();
				importUserRepoFindImportUsersSpy = importUserRepo.findImportUsers.mockResolvedValue([[], 0]);
				accountServiceFindByUserIdSpy = accountService.findByUserIdOrFail.mockResolvedValue({
					id: 'dummyId',
					userId: currentUser.id,
					username: currentUser.email,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
				importUserRepoDeleteImportUsersBySchoolSpy = importUserRepo.deleteImportUsersBySchool.mockResolvedValue();
				importUserRepoDeleteImportUserSpy = importUserRepo.delete.mockResolvedValue();
				schoolServiceSaveSpy = schoolService.save.mockReturnValueOnce(Promise.resolve(createMockSchoolDo(school)));
			});
			afterEach(() => {
				userRepoByIdSpy.mockRestore();
				permissionServiceSpy.mockRestore();
				importUserRepoFindImportUsersSpy.mockRestore();
				accountServiceFindByUserIdSpy.mockRestore();
				importUserRepoDeleteImportUsersBySchoolSpy.mockRestore();
				importUserRepoDeleteImportUserSpy.mockRestore();
				schoolServiceSpy.mockRestore();
				schoolServiceSaveSpy.mockRestore();
				userRepoFlushSpy.mockRestore();
			});
			it('Should request authorization service', async () => {
				await uc.saveAllUsersMatches(currentUser.id);

				expect(userRepoByIdSpy).toHaveBeenCalledWith(currentUser.id, true);
				expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [Permission.SCHOOL_IMPORT_USERS_MIGRATE]);
			});
			it('should not save ldap info to user if missing mandatory fields', async () => {
				importUserRepoFindImportUsersSpy = jest
					.spyOn(importUserRepo, 'findImportUsers')
					.mockResolvedValueOnce([[importUser1, importUser2, importUser3], 3]);

				const userRepoSaveSpy = jest.spyOn(userRepo, 'save');

				await uc.saveAllUsersMatches(currentUser.id);
				expect(userRepoSaveSpy).toHaveBeenCalledTimes(2);
				userRepoSaveSpy.mockRestore();
			});
			it('should save ldap info to user', async () => {
				importUserRepoFindImportUsersSpy = jest
					.spyOn(importUserRepo, 'findImportUsers')
					.mockResolvedValueOnce([[importUser1, importUser2], 2]);

				userMatch1.externalId = importUser1.externalId;
				userMatch2.externalId = importUser2.externalId;
				const userRepoSaveWithoutFlushSpy = jest.spyOn(userRepo, 'save').mockReturnValue(Promise.resolve());

				await uc.saveAllUsersMatches(currentUser.id);

				const filters = { matches: [MatchCreatorScope.MANUAL, MatchCreatorScope.AUTO] };
				expect(importUserRepoFindImportUsersSpy).toHaveBeenCalledWith(school, filters, {});
				expect(importUserRepoDeleteImportUserSpy).toHaveBeenCalledTimes(2);
				expect(userRepoSaveWithoutFlushSpy).toHaveBeenCalledTimes(2);
				expect(userRepoSaveWithoutFlushSpy.mock.calls).toEqual([[userMatch1], [userMatch2]]);
				userRepoSaveWithoutFlushSpy.mockRestore();
			});
			it('should remove import users for school', async () => {
				await uc.saveAllUsersMatches(currentUser.id);
				expect(importUserRepoDeleteImportUsersBySchoolSpy).toHaveBeenCalledWith(school);
			});
			it('should throw if school data is inconsistent', async () => {
				schoolServiceSpy.mockRestore();
				school.externalId = undefined;
				currentUser = userFactory.buildWithId({ school });
				schoolServiceSpy = schoolService.getSchoolById.mockResolvedValue(createMockSchoolDo(school));
				const result2 = () => uc.saveAllUsersMatches(currentUser.id);
				await expect(result2).rejects.toThrowError(BadRequestException);

				schoolServiceSpy.mockRestore();
				school.inUserMigration = undefined;
				currentUser = userFactory.buildWithId({ school });
				schoolServiceSpy = schoolService.getSchoolById.mockResolvedValue(createMockSchoolDo(school));
				const result3 = () => uc.saveAllUsersMatches(currentUser.id);
				await expect(result3).rejects.toThrowError(BadRequestException);

				schoolServiceSpy.mockRestore();
				school.inMaintenanceSince = new Date();
				currentUser = userFactory.buildWithId({ school });
				schoolServiceSpy = schoolService.getSchoolById.mockResolvedValue(createMockSchoolDo(school));
				const result4 = () => uc.saveAllUsersMatches(currentUser.id);
				await expect(result4).rejects.toThrowError(BadRequestException);
			});
		});

		describe('[startSchoolInUserMigration]', () => {
			let system: System;
			let school: SchoolEntity;
			let currentUser: User;
			let userRepoByIdSpy: jest.SpyInstance;
			let permissionServiceSpy: jest.SpyInstance;
			let schoolServiceSaveSpy: jest.SpyInstance;
			let schoolServiceSpy: jest.SpyInstance;
			let systemRepoSpy: jest.SpyInstance;
			const currentDate = new Date('2022-03-10T00:00:00.000Z');
			let dateSpy: jest.SpyInstance;
			beforeEach(() => {
				system = systemFactory.buildWithId({ ldapConfig: {} });
				school = schoolFactory.buildWithId();
				school.officialSchoolNumber = 'foo';
				currentUser = userFactory.buildWithId({ school });
				userRepoByIdSpy = userRepo.findById.mockResolvedValueOnce(currentUser);
				permissionServiceSpy = authorizationService.checkAllPermissions.mockReturnValue();
				schoolServiceSaveSpy = schoolService.save.mockReturnValueOnce(Promise.resolve(createMockSchoolDo(school)));
				schoolServiceSpy = schoolService.getSchoolById.mockResolvedValue(createMockSchoolDo(school));
				systemRepoSpy = systemRepo.findById.mockReturnValueOnce(Promise.resolve(system));
				setConfig(system.id);
				dateSpy = jest.spyOn(global, 'Date').mockReturnValue(currentDate as unknown as string);
			});
			afterEach(() => {
				userRepoByIdSpy.mockRestore();
				permissionServiceSpy.mockRestore();
				schoolServiceSaveSpy.mockRestore();
				schoolServiceSpy.mockRestore();
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
				expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [Permission.SCHOOL_IMPORT_USERS_MIGRATE]);
			});
			it('Should save school params', async () => {
				schoolServiceSaveSpy.mockRestore();
				schoolServiceSaveSpy = schoolService.save.mockImplementation((schoolDo: LegacySchoolDo) =>
					Promise.resolve(schoolDo)
				);
				await uc.startSchoolInUserMigration(currentUser.id);
				const schoolParams: LegacySchoolDo = { ...createMockSchoolDo(school) };
				schoolParams.inUserMigration = true;
				schoolParams.externalId = 'foo';
				schoolParams.inMaintenanceSince = currentDate;
				schoolParams.systems = [system.id];
				schoolParams.federalState.createdAt = currentDate;
				schoolParams.federalState.updatedAt = currentDate;

				expect(schoolServiceSaveSpy).toHaveBeenCalledWith(schoolParams);
			});

			it('should throw if school is already in inUserMigration', async () => {
				schoolServiceSpy.mockRestore();
				school.inUserMigration = true;
				schoolServiceSpy = schoolService.getSchoolById.mockResolvedValueOnce(createMockSchoolDo(school));
				const result = uc.startSchoolInUserMigration(currentUser.id);
				await expect(result).rejects.toThrowError(MigrationAlreadyActivatedException);
			});
			it('should throw migrationAlreadyActivatedException with correct properties', () => {
				const logMessage = new MigrationAlreadyActivatedException().getLogMessage();
				expect(logMessage).toBeDefined();
				expect(logMessage).toHaveProperty('message', 'Migration is already activated for this school');
			});
			it('should throw if school has no officialSchoolNumber ', async () => {
				school.officialSchoolNumber = undefined;
				schoolServiceSpy = schoolService.getSchoolById.mockResolvedValueOnce(createMockSchoolDo(school));
				const result = uc.startSchoolInUserMigration(currentUser.id);
				await expect(result).rejects.toThrowError(MissingSchoolNumberException);
			});
			it('should throw missingSchoolNumberException with correct properties', () => {
				const logMessage = new MissingSchoolNumberException().getLogMessage();
				expect(logMessage).toBeDefined();
				expect(logMessage).toHaveProperty('message', 'The school is missing a official school number');
			});
			it('should throw if school already has a persisted LDAP ', async () => {
				dateSpy.mockRestore();
				school = schoolFactory.buildWithId({ systems: [system] });
				schoolServiceSpy = schoolService.getSchoolById.mockResolvedValueOnce(createMockSchoolDo(school));
				const result = uc.startSchoolInUserMigration(currentUser.id, false);
				await expect(result).rejects.toThrowError(LdapAlreadyPersistedException);
			});
			it('should throw ldapAlreadyPersistedException with correct properties', () => {
				const logMessage = new LdapAlreadyPersistedException().getLogMessage();
				expect(logMessage).toBeDefined();
				expect(logMessage).toHaveProperty('message', 'LDAP is already Persisted');
			});
			it('should not throw if school has no school number but its own LDAP', async () => {
				school.officialSchoolNumber = undefined;
				schoolServiceSpy = schoolService.getSchoolById.mockResolvedValueOnce(createMockSchoolDo(school));
				const result = uc.startSchoolInUserMigration(currentUser.id, false);
				await expect(result).resolves.toBe(undefined);
			});
		});

		describe('[endSchoolMaintenance]', () => {
			let school: SchoolEntity;
			let currentUser: User;
			let userRepoByIdSpy: jest.SpyInstance;
			let permissionServiceSpy: jest.SpyInstance;
			let schoolServiceSaveSpy: jest.SpyInstance;
			let schoolServiceSpy: jest.SpyInstance;
			beforeEach(() => {
				school = schoolFactory.buildWithId();
				school.externalId = 'foo';
				school.inMaintenanceSince = new Date();
				school.inUserMigration = false;
				school.officialSchoolNumber = 'foo';
				currentUser = userFactory.buildWithId({ school });

				userRepoByIdSpy = userRepo.findById.mockResolvedValueOnce(currentUser);
				permissionServiceSpy = authorizationService.checkAllPermissions.mockReturnValue();
				schoolServiceSaveSpy = schoolService.save.mockReturnValue(Promise.resolve(createMockSchoolDo(school)));
				schoolServiceSpy = schoolService.getSchoolById.mockResolvedValue(createMockSchoolDo(school));
			});
			afterEach(() => {
				userRepoByIdSpy.mockRestore();
				permissionServiceSpy.mockRestore();
				schoolServiceSaveSpy.mockRestore();
				schoolServiceSpy.mockRestore();
			});
			it('Should request authorization service', async () => {
				await uc.endSchoolInMaintenance(currentUser.id);

				expect(userRepoByIdSpy).toHaveBeenCalledWith(currentUser.id, true);
				expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [Permission.SCHOOL_IMPORT_USERS_MIGRATE]);
			});
			it('should remove inMaitenanceSince for school', async () => {
				await uc.endSchoolInMaintenance(currentUser.id);
				const school2 = { ...createMockSchoolDo(school), inMaintenanceSince: undefined };
				expect(schoolServiceSaveSpy).toHaveBeenCalledWith(school2);
			});
			it('should throw if school is missing ldapSchoolIdenfitier', async () => {
				schoolServiceSpy.mockRestore();
				school.externalId = undefined;
				currentUser = userFactory.buildWithId({ school });
				schoolServiceSpy = schoolService.getSchoolById.mockResolvedValueOnce(createMockSchoolDo(school));
				const result1 = () => uc.endSchoolInMaintenance(currentUser.id);
				await expect(result1).rejects.toThrowError(BadRequestException);
			});
			it('should throw if school is missing inMaintenanceSince', async () => {
				schoolServiceSpy.mockRestore();
				school.inMaintenanceSince = undefined;
				currentUser = userFactory.buildWithId({ school });
				schoolServiceSpy = schoolService.getSchoolById.mockResolvedValueOnce(createMockSchoolDo(school));
				const result3 = () => uc.endSchoolInMaintenance(currentUser.id);
				await expect(result3).rejects.toThrowError(BadRequestException);
			});
			it('should throw if school is still inUserMigration mode', async () => {
				schoolServiceSpy.mockRestore();
				school.inUserMigration = true;
				currentUser = userFactory.buildWithId({ school });
				schoolServiceSpy = schoolService.getSchoolById.mockResolvedValueOnce(createMockSchoolDo(school));
				const result4 = () => uc.endSchoolInMaintenance(currentUser.id);
				await expect(result4).rejects.toThrowError(BadRequestException);
			});
		});
	});
});
