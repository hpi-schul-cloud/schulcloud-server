import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { LegacySchoolService } from '@modules/legacy-school';
import { LegacySchoolDo } from '@modules/legacy-school/domain';
import { legacySchoolDoFactory } from '@modules/legacy-school/testing';
import { SchoolFeature } from '@modules/school/domain';
import { schoolEntityFactory } from '@modules/school/testing';
import { System, SystemService } from '@modules/system';
import { systemFactory } from '@modules/system/testing';
import { UserService } from '@modules/user';
import { UserLoginMigrationDO } from '@modules/user-login-migration';
import { userLoginMigrationDOFactory } from '@modules/user-login-migration/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { UserAlreadyAssignedToImportUserError } from '../domain/error';
import { ImportUser, MatchCreator } from '../entity';
import {
	SchoolIdDoesNotMatchWithUserSchoolId,
	UserMigrationCanceledLoggable,
	UserMigrationIsNotEnabled,
} from '../loggable';
import { ImportUserRepo } from '../repo';
import { importUserFactory } from '../testing';
import { USER_IMPORT_CONFIG_TOKEN, UserImportConfig } from '../user-import-config';
import { UserImportService } from './user-import.service';

describe(UserImportService.name, () => {
	let module: TestingModule;
	let service: UserImportService;

	let userImportConfig: UserImportConfig;
	let importUserRepo: DeepMocked<ImportUserRepo>;
	let systemService: DeepMocked<SystemService>;
	let userService: DeepMocked<UserService>;
	let logger: DeepMocked<Logger>;
	let schoolService: DeepMocked<LegacySchoolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [User] })],
			providers: [
				UserImportService,
				{
					provide: ImportUserRepo,
					useValue: createMock<ImportUserRepo>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: USER_IMPORT_CONFIG_TOKEN,
					useValue: {},
				},
			],
		}).compile();

		service = module.get(UserImportService);
		userImportConfig = module.get(USER_IMPORT_CONFIG_TOKEN);
		importUserRepo = module.get(ImportUserRepo);
		systemService = module.get(SystemService);
		userService = module.get(UserService);
		logger = module.get(Logger);
		schoolService = module.get(LegacySchoolService);
	});

	beforeEach(() => {
		userImportConfig.featureUserMigrationSystemId = new ObjectId().toHexString();
		userImportConfig.featureUserMigrationEnabled = true;
		userImportConfig.featureMigrationWizardWithUserLoginMigration = true;
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('saveImportUsers', () => {
		describe('when saving import users', () => {
			const setup = () => {
				const importUser: ImportUser = importUserFactory.build();
				const otherImportUser: ImportUser = importUserFactory.build();

				return {
					importUsers: [importUser, otherImportUser],
				};
			};

			it('should call saveImportUsers', async () => {
				const { importUsers } = setup();

				await service.saveImportUsers(importUsers);

				expect(importUserRepo.saveImportUsers).toHaveBeenCalledWith(importUsers);
			});
		});
	});

	describe('getMigrationSystem', () => {
		describe('when fetching the migration system', () => {
			const setup = () => {
				const system: System = systemFactory.build();

				systemService.findByIdOrFail.mockResolvedValueOnce(system);

				return {
					system,
				};
			};

			it('should return the system', async () => {
				const { system } = setup();

				const result: System = await service.getMigrationSystem();

				expect(result).toEqual(system);
			});
		});
	});

	describe('checkFeatureEnabledAndIsLdapPilotSchool', () => {
		describe('when the global feature is enabled', () => {
			const setup = () => {
				userImportConfig.featureUserMigrationEnabled = true;

				const school = legacySchoolDoFactory.buildWithId({ features: undefined });

				return {
					school,
				};
			};

			it('should do nothing', () => {
				const { school } = setup();

				service.checkFeatureEnabledAndIsLdapPilotSchool(school);
			});
		});

		describe('when the school feature is enabled', () => {
			const setup = () => {
				userImportConfig.featureUserMigrationEnabled = false;

				const school = legacySchoolDoFactory.buildWithId({
					features: [SchoolFeature.LDAP_UNIVENTION_MIGRATION],
				});

				return {
					school,
				};
			};

			it('should do nothing', () => {
				const { school } = setup();

				service.checkFeatureEnabledAndIsLdapPilotSchool(school);
			});
		});

		describe('when the config are disabled', () => {
			const setup = () => {
				userImportConfig.featureUserMigrationEnabled = false;

				const school = legacySchoolDoFactory.buildWithId({
					features: [],
				});

				return {
					school,
				};
			};

			it('should do nothing', () => {
				const { school } = setup();

				expect(() => service.checkFeatureEnabledAndIsLdapPilotSchool(school)).toThrow(
					new InternalServerErrorException('User Migration not enabled')
				);
			});

			it('should log a warning', () => {
				const { school } = setup();

				expect(() => service.checkFeatureEnabledAndIsLdapPilotSchool(school)).toThrow(
					new InternalServerErrorException('User Migration not enabled')
				);
				expect(logger.warning).toHaveBeenCalledWith(new UserMigrationIsNotEnabled());
			});
		});

		describe('matchUsers', () => {
			describe('when all users have unique names', () => {
				const setup = () => {
					const school = schoolEntityFactory.buildWithId();
					const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build({ schoolId: school.id });
					const user1: User = userFactory.buildWithId({ firstName: 'First1', lastName: 'Last1' });
					const user2: User = userFactory.buildWithId({ firstName: 'First2', lastName: 'Last2' });
					const importUser1: ImportUser = importUserFactory.buildWithId({
						school,
						firstName: user1.firstName,
						lastName: user1.lastName,
					});
					const importUser2: ImportUser = importUserFactory.buildWithId({
						school,
						firstName: user2.firstName,
						lastName: user2.lastName,
					});

					userService.findUserBySchoolAndName.mockResolvedValueOnce([user1]);
					userService.findUserBySchoolAndName.mockResolvedValueOnce([user2]);

					return {
						user1,
						user2,
						importUser1,
						importUser2,
						userLoginMigration,
					};
				};

				it('should return all users as auto matched', async () => {
					const { user1, user2, importUser1, importUser2, userLoginMigration } = setup();

					const result: ImportUser[] = await service.matchUsers([importUser1, importUser2], userLoginMigration, false);

					expect(result).toEqual([
						{ ...importUser1, user: user1, matchedBy: MatchCreator.AUTO },
						{ ...importUser2, user: user2, matchedBy: MatchCreator.AUTO },
					]);
				});
			});

			describe('when preferred names are used and all users have unique names', () => {
				const setup = () => {
					const school = schoolEntityFactory.buildWithId();
					const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build({ schoolId: school.id });
					const user1: User = userFactory.buildWithId({ firstName: 'First1', lastName: 'Last1' });
					const user2: User = userFactory.buildWithId({ firstName: 'First2', lastName: 'Last2' });
					const importUser1: ImportUser = importUserFactory.buildWithId({
						school,
						preferredName: user1.preferredName,
						lastName: user1.lastName,
					});
					const importUser2: ImportUser = importUserFactory.buildWithId({
						school,
						firstName: user2.firstName,
						lastName: user2.lastName,
					});

					userService.findUserBySchoolAndName.mockResolvedValueOnce([user1]);
					userService.findUserBySchoolAndName.mockResolvedValueOnce([user2]);

					return {
						user1,
						user2,
						importUser1,
						importUser2,
						userLoginMigration,
					};
				};

				it('should return users with preferred name matched by preferred name and users without matched by first name', async () => {
					const { user1, user2, importUser1, importUser2, userLoginMigration } = setup();

					const result: ImportUser[] = await service.matchUsers([importUser1, importUser2], userLoginMigration, true);

					expect(result).toEqual([
						{ ...importUser1, user: user1, matchedBy: MatchCreator.AUTO },
						{ ...importUser2, user: user2, matchedBy: MatchCreator.AUTO },
					]);
				});
			});

			describe('when the imported users have the same names', () => {
				const setup = () => {
					const school = schoolEntityFactory.buildWithId();
					const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build({ schoolId: school.id });
					const user1: User = userFactory.buildWithId({ firstName: 'First', lastName: 'Last' });
					const importUser1: ImportUser = importUserFactory.buildWithId({
						school,
						firstName: user1.firstName,
						lastName: user1.lastName,
					});
					const importUser2: ImportUser = importUserFactory.buildWithId({
						school,
						firstName: user1.firstName,
						lastName: user1.lastName,
					});

					userService.findUserBySchoolAndName.mockResolvedValueOnce([user1]);
					userService.findUserBySchoolAndName.mockResolvedValueOnce([user1]);

					return {
						user1,
						importUser1,
						importUser2,
						userLoginMigration,
					};
				};

				it('should return the users without a match', async () => {
					const { importUser1, importUser2, userLoginMigration } = setup();

					const result: ImportUser[] = await service.matchUsers([importUser1, importUser2], userLoginMigration, false);

					expect(result).toEqual([importUser1, importUser2]);
				});
			});

			describe('when existing users in svs have the same names', () => {
				const setup = () => {
					const school = schoolEntityFactory.buildWithId();
					const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build({ schoolId: school.id });
					const user1: User = userFactory.buildWithId({ firstName: 'First', lastName: 'Last' });
					const user2: User = userFactory.buildWithId({ firstName: 'First', lastName: 'Last' });
					const importUser1: ImportUser = importUserFactory.buildWithId({
						school,
						firstName: user1.firstName,
						lastName: user1.lastName,
					});

					userService.findUserBySchoolAndName.mockResolvedValueOnce([user1, user2]);
					userService.findUserBySchoolAndName.mockResolvedValueOnce([user1, user2]);

					return {
						user1,
						user2,
						importUser1,
						userLoginMigration,
					};
				};

				it('should return the users without a match', async () => {
					const { importUser1, userLoginMigration } = setup();

					const result: ImportUser[] = await service.matchUsers([importUser1], userLoginMigration, false);

					expect(result).toEqual([importUser1]);
				});
			});

			describe('when import users have the same name ', () => {
				const setup = () => {
					const school = schoolEntityFactory.buildWithId();
					const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build({ schoolId: school.id });
					const user1: User = userFactory.buildWithId({ firstName: 'First', lastName: 'Last' });
					const importUser1: ImportUser = importUserFactory.buildWithId({
						school,
						firstName: user1.firstName,
						lastName: user1.lastName,
					});
					const importUser2: ImportUser = importUserFactory.buildWithId({
						school,
						firstName: user1.firstName,
						lastName: user1.lastName,
					});

					userService.findUserBySchoolAndName.mockResolvedValueOnce([user1]);
					userService.findUserBySchoolAndName.mockResolvedValueOnce([user1]);

					return {
						user1,
						importUser1,
						importUser2,
						userLoginMigration,
					};
				};

				it('should return the users without a match', async () => {
					const { importUser1, importUser2, userLoginMigration } = setup();

					const result: ImportUser[] = await service.matchUsers([importUser1, importUser2], userLoginMigration, false);

					result.forEach((importUser) => expect(importUser.matchedBy).toBeUndefined());
				});
			});

			describe('when a user is already migarted', () => {
				const setup = () => {
					const school = schoolEntityFactory.buildWithId();
					const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build({ schoolId: school.id });
					const user1: User = userFactory.buildWithId({
						firstName: 'First',
						lastName: 'Last',
						lastLoginSystemChange: userLoginMigration.startedAt,
					});
					const importUser1: ImportUser = importUserFactory.buildWithId({
						school,
						firstName: user1.firstName,
						lastName: user1.lastName,
					});

					userService.findUserBySchoolAndName.mockResolvedValueOnce([user1]);

					return {
						user1,
						importUser1,
						userLoginMigration,
					};
				};

				it('should return the user without a match', async () => {
					const { importUser1, userLoginMigration } = setup();

					const result: ImportUser[] = await service.matchUsers([importUser1], userLoginMigration, false);

					result.forEach((importUser) => expect(importUser.matchedBy).toBeUndefined());
				});
			});
		});

		describe('deleteImportUsersBySchool', () => {
			describe('when deleting all import users of school', () => {
				const setup = () => {
					const school = schoolEntityFactory.buildWithId();

					return {
						school,
					};
				};

				it('should call deleteImportUsersBySchool', async () => {
					const { school } = setup();

					await service.deleteImportUsersBySchool(school);

					expect(importUserRepo.deleteImportUsersBySchool).toHaveBeenCalledWith(school);
				});
			});
		});
	});

	describe('resetMigrationForUsersSchool', () => {
		describe('when resetting the migration for a school', () => {
			const setup = () => {
				const currentUser: User = userFactory.build();
				const school = legacySchoolDoFactory.build();

				return {
					currentUser,
					school,
				};
			};

			it('should delete import users for school', async () => {
				const { currentUser, school } = setup();

				await service.resetMigrationForUsersSchool(currentUser, school);

				expect(importUserRepo.deleteImportUsersBySchool).toHaveBeenCalledWith(currentUser.school);
			});

			it('should save school with reset migration flags', async () => {
				const { currentUser, school } = setup();

				await service.resetMigrationForUsersSchool(currentUser, school);

				expect(schoolService.save).toHaveBeenCalledWith(
					{
						...school,
						inUserMigration: undefined,
						inMaintenanceSince: undefined,
					},
					true
				);
			});

			it('should log canceled migration', async () => {
				const { currentUser, school } = setup();

				await service.resetMigrationForUsersSchool(currentUser, school);

				expect(logger.notice).toHaveBeenCalledWith(new UserMigrationCanceledLoggable(expect.any(LegacySchoolDo)));
			});
		});
	});

	describe('validateSameSchool', () => {
		const setup = () => {
			const school = schoolEntityFactory.buildWithId();
			const importUser = importUserFactory.buildWithId({ school });
			const userMatch = userFactory.buildWithId({ school });

			return { school, importUser, userMatch };
		};

		it('should do nothing when all school ids match', () => {
			const { school, importUser, userMatch } = setup();

			expect(() => service.validateSameSchool(school.id, importUser, userMatch)).not.toThrow();
		});

		it('should throw ForbiddenException when user school id does not match', () => {
			const { school, importUser, userMatch } = setup();
			userMatch.school = schoolEntityFactory.buildWithId(); // different school id

			expect(() => service.validateSameSchool(school.id, importUser, userMatch)).toThrow(ForbiddenException);
			expect(logger.warning).toHaveBeenCalledWith(expect.any(SchoolIdDoesNotMatchWithUserSchoolId));
		});

		it('should throw ForbiddenException when importUser school id does not match', () => {
			const { school, userMatch } = setup();
			const differentSchool = schoolEntityFactory.buildWithId();
			const importUser = importUserFactory.buildWithId({ school: differentSchool });

			expect(() => service.validateSameSchool(school.id, importUser, userMatch)).toThrow(ForbiddenException);
			expect(logger.warning).toHaveBeenCalledWith(expect.any(SchoolIdDoesNotMatchWithUserSchoolId));
		});
	});

	describe('checkUserIsAlreadyAssigned', () => {
		it('should throw UserAlreadyAssignedToImportUserError when hasMatch is not null', () => {
			const hasMatch = importUserFactory.build();

			expect(() => service.checkUserIsAlreadyAssigned(hasMatch)).toThrow(UserAlreadyAssignedToImportUserError);
		});

		it('should not throw when hasMatch is null', () => {
			expect(() => service.checkUserIsAlreadyAssigned(null)).not.toThrow();
		});
	});
});
