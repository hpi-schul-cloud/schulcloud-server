import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Account, AccountService } from '@modules/account';
import { AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { UserService } from '@modules/user';
import { UserLoginMigrationNotActiveLoggableException } from '@modules/user-import/loggable/user-login-migration-not-active.loggable-exception';
import { UserLoginMigrationService, UserMigrationService } from '@modules/user-login-migration';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UserAlreadyAssignedToImportUserError } from '@shared/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { ImportUser, MatchCreator, SchoolEntity, SystemEntity, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { MatchCreatorScope, SchoolFeature } from '@shared/domain/types';
import { ImportUserRepo, LegacySystemRepo, UserRepo } from '@shared/repo';
import {
	federalStateFactory,
	importUserFactory,
	legacySchoolDoFactory,
	schoolEntityFactory,
	setupEntities,
	userDoFactory,
	userFactory,
	userLoginMigrationDOFactory,
} from '@shared/testing';
import { systemEntityFactory } from '@shared/testing/factory/systemEntityFactory';
import { Logger } from '@src/core/logger';
import { SchoolNotMigratedLoggableException, UserAlreadyMigratedLoggable } from '../loggable';
import { UserImportService } from '../service';
import { UserImportConfig } from '../user-import-config';
import {
	LdapAlreadyPersistedException,
	MigrationAlreadyActivatedException,
	MissingSchoolNumberException,
} from './ldap-user-migration.error';
import { UserImportUc } from './user-import.uc';

describe('[ImportUserModule]', () => {
	describe(UserImportUc.name, () => {
		let module: TestingModule;
		let uc: UserImportUc;
		let accountService: DeepMocked<AccountService>;
		let importUserRepo: DeepMocked<ImportUserRepo>;
		let schoolService: DeepMocked<LegacySchoolService>;
		let systemRepo: DeepMocked<LegacySystemRepo>;
		let userRepo: DeepMocked<UserRepo>;
		let userService: DeepMocked<UserService>;
		let authorizationService: DeepMocked<AuthorizationService>;
		let userImportService: DeepMocked<UserImportService>;
		let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
		let userMigrationService: DeepMocked<UserMigrationService>;
		let logger: DeepMocked<Logger>;

		const config: UserImportConfig = {
			FEATURE_USER_MIGRATION_ENABLED: true,
			FEATURE_USER_MIGRATION_SYSTEM_ID: new ObjectId().toHexString(),
			FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION: false,
			IMPORTUSER_SAVE_ALL_MATCHES_REQUEST_TIMEOUT_MS: 80000,
		};

		beforeAll(async () => {
			await setupEntities();

			module = await Test.createTestingModule({
				providers: [
					UserImportUc,
					{
						provide: ConfigService,
						useValue: {
							get: jest.fn().mockImplementation((key: keyof UserImportConfig) => config[key]),
						},
					},
					{
						provide: AccountService,
						useValue: createMock<AccountService>(),
					},
					{
						provide: ImportUserRepo,
						useValue: createMock<ImportUserRepo>(),
					},
					{
						provide: LegacySchoolService,
						useValue: createMock<LegacySchoolService>(),
					},
					{
						provide: LegacySystemRepo,
						useValue: createMock<LegacySystemRepo>(),
					},
					{
						provide: UserRepo,
						useValue: createMock<UserRepo>(),
					},
					{
						provide: UserService,
						useValue: createMock<UserService>(),
					},
					{
						provide: AuthorizationService,
						useValue: createMock<AuthorizationService>(),
					},
					{
						provide: UserImportService,
						useValue: createMock<UserImportService>(),
					},
					{
						provide: UserLoginMigrationService,
						useValue: createMock<UserLoginMigrationService>(),
					},
					{
						provide: UserMigrationService,
						useValue: createMock<UserMigrationService>(),
					},
					{
						provide: Logger,
						useValue: createMock<Logger>(),
					},
				],
			}).compile();

			uc = module.get(UserImportUc); // TODO UserRepo not available in UserUc?!
			accountService = module.get(AccountService);
			importUserRepo = module.get(ImportUserRepo);
			schoolService = module.get(LegacySchoolService);
			systemRepo = module.get(LegacySystemRepo);
			userRepo = module.get(UserRepo);
			userService = module.get(UserService);
			authorizationService = module.get(AuthorizationService);
			userImportService = module.get(UserImportService);
			userLoginMigrationService = module.get(UserLoginMigrationService);
			userMigrationService = module.get(UserMigrationService);
			logger = module.get(Logger);
		});

		beforeEach(() => {
			config.FEATURE_USER_MIGRATION_ENABLED = true;
			config.FEATURE_USER_MIGRATION_SYSTEM_ID = new ObjectId().toHexString();
			config.FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION = false;
		});

		afterAll(async () => {
			await module.close();
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		const createMockSchoolDo = (school?: SchoolEntity): LegacySchoolDo => {
			const name = school ? school.name : 'testSchool';
			const id = school ? school.id : 'someId';
			const features = school ? school.features ?? [SchoolFeature.LDAP_UNIVENTION_MIGRATION] : [];
			const externalId = school ? school.externalId : undefined;
			const officialSchoolNumber = school ? school.officialSchoolNumber : undefined;
			const inMaintenanceSince = school ? school.inMaintenanceSince : undefined;
			const inUserMigration = school ? school.inUserMigration : undefined;
			const systems =
				school && school.systems.isInitialized()
					? school.systems.getItems().map((system: SystemEntity) => system.id)
					: [];
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
				expect(permissionServiceSpy).toHaveBeenCalledWith(user, [Permission.IMPORT_USER_VIEW]);
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
				const userRepoFindUnmatchedSpy = jest.spyOn(userRepo, 'findForImportUser').mockResolvedValueOnce([[], 0]);
				const query = {};
				const [result, count] = await uc.findAllUnmatchedUsers(user.id, query);
				expect(userRepoByIdSpy).toHaveBeenCalledWith(user.id, true);
				expect(permissionServiceSpy).toHaveBeenCalledWith(user, [Permission.IMPORT_USER_VIEW]);
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
					const school = schoolEntityFactory.buildWithId();
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
						const school = schoolEntityFactory.buildWithId();
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
						expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [Permission.IMPORT_USER_UPDATE]);
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
						const school = schoolEntityFactory.buildWithId();
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
						expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [Permission.IMPORT_USER_UPDATE]);
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
						const school = schoolEntityFactory.buildWithId();
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
						const school = schoolEntityFactory.buildWithId();
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
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [Permission.IMPORT_USER_UPDATE]);
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
						const school = schoolEntityFactory.buildWithId();
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
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [Permission.IMPORT_USER_UPDATE]);
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
						const school = schoolEntityFactory.buildWithId();
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
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [Permission.IMPORT_USER_UPDATE]);
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
						const school = schoolEntityFactory.buildWithId();
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
						expect(permissionServiceSpy).toHaveBeenCalledWith(user, [Permission.IMPORT_USER_UPDATE]);
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
			let system: SystemEntity;
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
				system = systemEntityFactory.buildWithId();
				school = schoolEntityFactory.buildWithId({ systems: [system] });
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
				accountServiceFindByUserIdSpy = accountService.findByUserId
					.mockResolvedValue(
						new Account({
							id: 'dummyId',
							userId: currentUser.id,
							username: currentUser.email,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
					)
					.mockResolvedValueOnce(null);
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
				expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [Permission.IMPORT_USER_MIGRATE]);
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

		describe('saveAllUsersMatches', () => {
			describe('when the instance is nbc', () => {
				describe('when migrating users', () => {
					const setup = () => {
						const system = systemEntityFactory.buildWithId();
						const schoolEntity = schoolEntityFactory.buildWithId();
						const user = userFactory.buildWithId({
							school: schoolEntity,
						});
						const school = legacySchoolDoFactory.build({
							id: schoolEntity.id,
							externalId: 'externalId',
							officialSchoolNumber: 'officialSchoolNumber',
							inUserMigration: true,
							inMaintenanceSince: new Date(),
							systems: [system.id],
						});
						const importUser = importUserFactory.buildWithId({
							school: schoolEntity,
							user: userFactory.buildWithId({
								school: schoolEntity,
							}),
							matchedBy: MatchCreator.AUTO,
							system,
							externalId: 'externalId',
						});
						const importUserWithoutUser = importUserFactory.buildWithId({
							school: schoolEntity,
							system,
						});

						userRepo.findById.mockResolvedValueOnce(user);
						userService.findByExternalId.mockResolvedValueOnce(null);
						schoolService.getSchoolById.mockResolvedValueOnce(school);
						importUserRepo.findImportUsers.mockResolvedValueOnce([[importUser, importUserWithoutUser], 2]);
						config.FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION = true;

						return {
							user,
							importUser,
							importUserWithoutUser,
						};
					};

					it('should migrate users with the user login migration', async () => {
						const { user, importUser } = setup();

						await uc.saveAllUsersMatches(user.id);

						expect(userMigrationService.migrateUser).toHaveBeenCalledWith(
							importUser.user?.id,
							importUser.externalId,
							importUser.system.id
						);
					});

					it('should skip import users without linked users', async () => {
						const { user, importUserWithoutUser } = setup();

						await uc.saveAllUsersMatches(user.id);

						expect(userMigrationService.migrateUser).not.toHaveBeenCalledWith(
							importUserWithoutUser.user?.id,
							importUserWithoutUser.externalId,
							importUserWithoutUser.system.id
						);
					});
				});
				describe('when user is already migrated', () => {
					const setup = () => {
						const system = systemEntityFactory.buildWithId();
						const schoolEntity = schoolEntityFactory.buildWithId();
						const user = userFactory.buildWithId({
							school: schoolEntity,
							externalId: 'externalId',
						});
						const school = legacySchoolDoFactory.build({
							id: schoolEntity.id,
							externalId: 'externalId',
							officialSchoolNumber: 'officialSchoolNumber',
							inUserMigration: true,
							inMaintenanceSince: new Date(),
							systems: [system.id],
						});
						const importUser = importUserFactory.buildWithId({
							school: schoolEntity,
							user: userFactory.buildWithId({
								school: schoolEntity,
							}),
							matchedBy: MatchCreator.AUTO,
							system,
						});
						const importUserWithoutUser = importUserFactory.buildWithId({
							school: schoolEntity,
							system,
						});

						userRepo.findById.mockResolvedValueOnce(user);
						schoolService.getSchoolById.mockResolvedValueOnce(school);
						userService.findByExternalId.mockResolvedValueOnce(
							userDoFactory.buildWithId({ id: user.id, externalId: user.externalId })
						);
						importUserRepo.findImportUsers.mockResolvedValueOnce([[importUser, importUserWithoutUser], 2]);
						config.FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION = true;

						return {
							user,
							importUser,
							importUserWithoutUser,
						};
					};

					it('should skip import users with externalId', async () => {
						const { user, importUser } = setup();

						await uc.saveAllUsersMatches(user.id);

						expect(userMigrationService.migrateUser).not.toHaveBeenCalledWith(
							importUser.user?.id,
							importUser.user?.externalId,
							importUser.system.id
						);
					});
					it('should log information for skipped user ', async () => {
						const { user, importUser } = setup();

						await uc.saveAllUsersMatches(user.id);

						expect(logger.notice).toHaveBeenCalledWith(new UserAlreadyMigratedLoggable(importUser.user!.id));
					});
				});
			});

			describe('when the user does not have an account', () => {
				const setup = () => {
					const system = systemEntityFactory.buildWithId();
					const schoolEntity = schoolEntityFactory.buildWithId();
					const user = userFactory.buildWithId({
						school: schoolEntity,
					});
					const school = legacySchoolDoFactory.build({
						id: schoolEntity.id,
						externalId: 'externalId',
						officialSchoolNumber: 'officialSchoolNumber',
						inUserMigration: true,
						inMaintenanceSince: new Date(),
						systems: [system.id],
					});
					const importUser = importUserFactory.buildWithId({
						school: schoolEntity,
						user,
						matchedBy: MatchCreator.AUTO,
						system,
					});

					userRepo.findById.mockResolvedValueOnce(user);
					schoolService.getSchoolById.mockResolvedValueOnce(school);
					importUserRepo.findImportUsers.mockResolvedValueOnce([[importUser], 1]);
					accountService.findByUserId.mockResolvedValueOnce(null);

					return { user };
				};

				it('should create it for the user', async () => {
					const { user } = setup();

					await uc.saveAllUsersMatches(user.id);

					expect(accountService.save).toHaveBeenCalledWith(expect.objectContaining({ userId: user.id }));
				});
			});
		});

		describe('[startSchoolInUserMigration]', () => {
			let system: SystemEntity;
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
				system = systemEntityFactory.buildWithId({ ldapConfig: {} });
				school = schoolEntityFactory.buildWithId();
				school.officialSchoolNumber = 'foo';
				currentUser = userFactory.buildWithId({ school });
				userRepoByIdSpy = userRepo.findById.mockResolvedValueOnce(currentUser);
				permissionServiceSpy = authorizationService.checkAllPermissions.mockReturnValue();
				schoolServiceSaveSpy = schoolService.save.mockReturnValueOnce(Promise.resolve(createMockSchoolDo(school)));
				schoolServiceSpy = schoolService.getSchoolById.mockResolvedValue(createMockSchoolDo(school));
				systemRepoSpy = systemRepo.findById.mockReturnValueOnce(Promise.resolve(system));
				config.FEATURE_USER_MIGRATION_SYSTEM_ID = system.id;
				dateSpy = jest.spyOn(global, 'Date').mockReturnValue(currentDate as unknown as string);
			});

			afterEach(() => {
				userRepoByIdSpy.mockRestore();
				permissionServiceSpy.mockRestore();
				schoolServiceSaveSpy.mockRestore();
				schoolServiceSpy.mockRestore();
				systemRepoSpy.mockRestore();
				dateSpy.mockRestore();
			});

			it('Should fetch system id from configuration', async () => {
				await uc.startSchoolInUserMigration(currentUser.id);

				expect(userImportService.getMigrationSystem).toHaveBeenCalled();
			});

			it('Should request authorization service', async () => {
				await uc.startSchoolInUserMigration(currentUser.id);

				expect(userRepoByIdSpy).toHaveBeenCalledWith(currentUser.id, true);
				expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [Permission.IMPORT_USER_MIGRATE]);
			});

			it('Should save school params', async () => {
				schoolServiceSaveSpy.mockRestore();
				schoolServiceSaveSpy = schoolService.save.mockImplementation((schoolDo: LegacySchoolDo) =>
					Promise.resolve(schoolDo)
				);
				userImportService.getMigrationSystem.mockResolvedValueOnce(system);

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
				school = schoolEntityFactory.buildWithId({ systems: [system] });
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

		describe('startSchoolInUserMigration', () => {
			describe('when the instance is nbc', () => {
				describe('when the school has already migrated', () => {
					const setup = () => {
						const targetSystemId = new ObjectId().toHexString();
						const user = userFactory.buildWithId();
						const school = legacySchoolDoFactory.buildWithId({
							externalId: 'externalId',
							officialSchoolNumber: 'officialSchoolNumber',
							inUserMigration: undefined,
							systems: [targetSystemId],
						});
						const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
							schoolId: school.id,
							targetSystemId,
						});

						config.FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION = true;
						userRepo.findById.mockResolvedValueOnce(user);
						schoolService.getSchoolById.mockResolvedValueOnce(school);
						userLoginMigrationService.findMigrationBySchool.mockResolvedValue(userLoginMigration);

						return {
							user,
							school,
						};
					};

					it('should check the users permission', async () => {
						const { user } = setup();

						await uc.startSchoolInUserMigration(user.id);

						expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [
							Permission.IMPORT_USER_MIGRATE,
						]);
					});

					it('should set the school in migration for the wizard', async () => {
						const { user, school } = setup();

						await uc.startSchoolInUserMigration(user.id);

						expect(schoolService.save).toHaveBeenCalledWith({
							...school,
							inUserMigration: true,
							inMaintenanceSince: expect.any(Date),
						});
					});
				});

				describe('when user login migration is closed', () => {
					const setup = () => {
						const targetSystemId = new ObjectId().toHexString();
						const user = userFactory.buildWithId();
						const school = legacySchoolDoFactory.buildWithId({
							externalId: 'externalId',
							officialSchoolNumber: 'officialSchoolNumber',
							inUserMigration: undefined,
							systems: [targetSystemId],
						});
						const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
							schoolId: school.id,
							targetSystemId,
							closedAt: new Date(),
						});

						config.FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION = true;
						userRepo.findById.mockResolvedValueOnce(user);
						schoolService.getSchoolById.mockResolvedValueOnce(school);
						userLoginMigrationService.findMigrationBySchool.mockResolvedValue(userLoginMigration);

						return {
							user,
						};
					};

					it('should throw UserLoginMigrationNotActiveLoggableException', async () => {
						const { user } = setup();

						await expect(uc.startSchoolInUserMigration(user.id)).rejects.toThrow(
							UserLoginMigrationNotActiveLoggableException
						);
					});
				});

				describe('when the user login migration is not running', () => {
					const setup = () => {
						const targetSystemId = new ObjectId().toHexString();
						const user = userFactory.buildWithId();
						const school = legacySchoolDoFactory.buildWithId({
							externalId: 'externalId',
							officialSchoolNumber: 'officialSchoolNumber',
							inUserMigration: undefined,
							systems: [targetSystemId],
						});

						config.FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION = true;
						userRepo.findById.mockResolvedValueOnce(user);
						schoolService.getSchoolById.mockResolvedValueOnce(school);
						userLoginMigrationService.findMigrationBySchool.mockResolvedValue(null);

						return {
							user,
							school,
						};
					};

					it('should throw an error', async () => {
						const { user } = setup();

						await expect(uc.startSchoolInUserMigration(user.id)).rejects.toThrow(NotFoundLoggableException);
					});
				});

				describe('when the school has not migrated', () => {
					const setup = () => {
						const targetSystemId = new ObjectId().toHexString();
						const user = userFactory.buildWithId();
						const school = legacySchoolDoFactory.buildWithId({
							externalId: 'externalId',
							officialSchoolNumber: 'officialSchoolNumber',
							inUserMigration: undefined,
							systems: [],
						});
						const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
							schoolId: school.id,
							targetSystemId,
						});

						config.FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION = true;
						userRepo.findById.mockResolvedValueOnce(user);
						schoolService.getSchoolById.mockResolvedValueOnce(school);
						userLoginMigrationService.findMigrationBySchool.mockResolvedValue(userLoginMigration);

						return {
							user,
							school,
						};
					};

					it('should throw an error', async () => {
						const { user } = setup();

						await expect(uc.startSchoolInUserMigration(user.id)).rejects.toThrow(SchoolNotMigratedLoggableException);
					});
				});
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
				school = schoolEntityFactory.buildWithId();
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
				expect(permissionServiceSpy).toHaveBeenCalledWith(currentUser, [Permission.IMPORT_USER_MIGRATE]);
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

		describe('endSchoolInMaintenance', () => {
			describe('when the instance is nbc', () => {
				describe('when closing the maintenance', () => {
					const setup = () => {
						const user = userFactory.buildWithId();
						const school = legacySchoolDoFactory.buildWithId({
							externalId: 'externalId',
							officialSchoolNumber: 'officialSchoolNumber',
							inUserMigration: false,
							inMaintenanceSince: new Date(),
						});

						userRepo.findById.mockResolvedValueOnce(user);
						schoolService.getSchoolById.mockResolvedValueOnce(school);
						config.FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION = true;

						return {
							user,
						};
					};

					it('should reset the migration flag', async () => {
						const { user } = setup();

						await uc.endSchoolInMaintenance(user.id);

						expect(schoolService.save).toHaveBeenCalledWith(expect.objectContaining({ inUserMigration: undefined }));
					});
				});
			});
		});

		describe('cancelMigration', () => {
			describe('when user is given', () => {
				const setup = () => {
					const school = legacySchoolDoFactory.buildWithId({
						inMaintenanceSince: new Date(2024, 1, 1),
						inUserMigration: true,
					});
					const user = userFactory.buildWithId();

					userRepo.findById.mockResolvedValueOnce(user);
					schoolService.getSchoolById.mockResolvedValueOnce(school);
					config.FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION = true;

					return {
						user,
						school,
					};
				};

				it('should check users permissions', async () => {
					const { user } = setup();

					await uc.cancelMigration(user.id);

					expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.IMPORT_USER_MIGRATE]);
				});

				it('should check if feature is enabled', async () => {
					setup();

					await uc.cancelMigration(new ObjectId().toHexString());

					expect(userImportService.checkFeatureEnabled).toHaveBeenCalled();
				});

				it('should call reset migration', async () => {
					const { user, school } = setup();

					await uc.cancelMigration(user.id);

					expect(userImportService.resetMigrationForUsersSchool).toHaveBeenCalledWith(user, school);
				});
			});
		});
	});
});
