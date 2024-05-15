import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { LegacySchoolService } from '@modules/legacy-school';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacySchoolDo, Page, UserDO, UserLoginMigrationDO } from '@shared/domain/domainobject';
import { UserLoginMigrationRepo } from '@shared/repo/userloginmigration/user-login-migration.repo';
import {
	legacySchoolDoFactory,
	setupEntities,
	userDoFactory,
	userLoginMigrationDOFactory,
} from '@shared/testing/factory';
import { LegacyLogger, Logger } from '@src/core/logger';
import {
	SchoolMigrationDatabaseOperationFailedLoggableException,
	SchoolNumberMismatchLoggableException,
} from '../loggable';
import { SchoolMigrationService } from './school-migration.service';

describe(SchoolMigrationService.name, () => {
	let module: TestingModule;
	let service: SchoolMigrationService;

	let userService: DeepMocked<UserService>;
	let schoolService: DeepMocked<LegacySchoolService>;
	let userLoginMigrationRepo: DeepMocked<UserLoginMigrationRepo>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		jest.useFakeTimers();

		module = await Test.createTestingModule({
			providers: [
				SchoolMigrationService,
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: UserLoginMigrationRepo,
					useValue: createMock<UserLoginMigrationRepo>(),
				},
			],
		}).compile();

		service = module.get(SchoolMigrationService);
		schoolService = module.get(LegacySchoolService);
		userService = module.get(UserService);
		userLoginMigrationRepo = module.get(UserLoginMigrationRepo);
		logger = module.get(Logger);

		await setupEntities();
	});

	afterAll(async () => {
		jest.useRealTimers();
		await module.close();
	});

	describe('migrateSchool', () => {
		describe('when a school without systems successfully migrates', () => {
			const setup = () => {
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({
					id: 'schoolId',
					name: 'schoolName',
					officialSchoolNumber: 'officialSchoolNumber',
					externalId: 'firstExternalId',
					systems: undefined,
				});
				const targetSystemId = 'targetSystemId';
				const targetExternalId = 'targetExternalId';

				return {
					school,
					targetSystemId,
					sourceExternalId: school.externalId,
					targetExternalId,
				};
			};

			it('should save the migrated school and add the system', async () => {
				const { school, targetSystemId, targetExternalId, sourceExternalId } = setup();

				await service.migrateSchool({ ...school }, targetExternalId, targetSystemId);

				expect(schoolService.save).toHaveBeenCalledWith({
					...school,
					externalId: targetExternalId,
					previousExternalId: sourceExternalId,
					systems: [targetSystemId],
				});
			});
		});

		describe('when a school with systems successfully migrates', () => {
			const setup = () => {
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({
					id: 'schoolId',
					name: 'schoolName',
					officialSchoolNumber: 'officialSchoolNumber',
					externalId: 'firstExternalId',
					systems: ['otherSystemId'],
				});
				const targetSystemId = 'targetSystemId';
				const targetExternalId = 'targetExternalId';

				return {
					school,
					targetSystemId,
					sourceExternalId: school.externalId,
					targetExternalId,
				};
			};

			it('should save the migrated school and add the system', async () => {
				const { school, targetSystemId, targetExternalId, sourceExternalId } = setup();

				await service.migrateSchool({ ...school }, targetExternalId, targetSystemId);

				expect(schoolService.save).toHaveBeenCalledWith({
					...school,
					externalId: targetExternalId,
					previousExternalId: sourceExternalId,
					systems: ['otherSystemId', targetSystemId],
				});
			});
		});

		describe('when saving to the database fails', () => {
			const setup = () => {
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({
					id: 'schoolId',
					name: 'schoolName',
					officialSchoolNumber: 'officialSchoolNumber',
					externalId: 'firstExternalId',
				});
				const targetSystemId = 'targetSystemId';
				const targetExternalId = 'targetExternalId';

				const error = new Error('Cannot save');

				schoolService.save.mockRejectedValueOnce(error);
				schoolService.save.mockRejectedValueOnce(error);

				return {
					school,
					targetSystemId,
					sourceExternalId: school.externalId,
					targetExternalId,
					error,
				};
			};

			it('should roll back any changes to the school', async () => {
				const { school, targetSystemId, targetExternalId } = setup();

				await expect(service.migrateSchool({ ...school }, targetExternalId, targetSystemId)).rejects.toThrow();

				expect(schoolService.save).toHaveBeenLastCalledWith(school);
			});

			it('should log a rollback error', async () => {
				const { school, targetSystemId, targetExternalId, error } = setup();

				await expect(service.migrateSchool({ ...school }, targetExternalId, targetSystemId)).rejects.toThrow();

				expect(logger.warning).toHaveBeenCalledWith(
					new SchoolMigrationDatabaseOperationFailedLoggableException(school, 'rollback', error)
				);
			});

			it('should throw an error', async () => {
				const { school, targetSystemId, targetExternalId, error } = setup();

				await expect(service.migrateSchool({ ...school }, targetExternalId, targetSystemId)).rejects.toThrow(
					new SchoolMigrationDatabaseOperationFailedLoggableException(school, 'migration', error)
				);
			});
		});
	});

	describe('getSchoolForMigration', () => {
		describe('when the school has to be migrated', () => {
			const setup = () => {
				const officialSchoolNumber = 'officialSchoolNumber';
				const sourceExternalId = 'sourceExternalId';
				const targetExternalId = 'targetExternalId';
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({
					id: 'schoolId',
					name: 'schoolName',
					officialSchoolNumber,
					externalId: sourceExternalId,
				});

				const user: UserDO = userDoFactory.build({ id: new ObjectId().toHexString(), schoolId: school.id });

				userService.findById.mockResolvedValue(user);
				schoolService.getSchoolById.mockResolvedValue(school);

				return {
					userId: user.id as string,
					user,
					officialSchoolNumber,
					school,
					targetExternalId,
				};
			};

			it('should return the school', async () => {
				const { userId, targetExternalId, officialSchoolNumber, school } = setup();

				const result = await service.getSchoolForMigration(userId, targetExternalId, officialSchoolNumber);

				expect(result).toEqual(school);
			});
		});

		describe('when the school is already migrated', () => {
			const setup = () => {
				const officialSchoolNumber = 'officialSchoolNumber';
				const sourceExternalId = 'sourceExternalId';
				const targetExternalId = 'targetExternalId';
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({
					id: 'schoolId',
					name: 'schoolName',
					officialSchoolNumber,
					externalId: targetExternalId,
					previousExternalId: sourceExternalId,
				});

				const user: UserDO = userDoFactory.build({ id: new ObjectId().toHexString(), schoolId: school.id });

				userService.findById.mockResolvedValue(user);
				schoolService.getSchoolById.mockResolvedValue(school);

				return {
					userId: user.id as string,
					user,
					officialSchoolNumber,
					school,
					targetExternalId,
				};
			};

			it('should return null', async () => {
				const { userId, targetExternalId, officialSchoolNumber } = setup();

				const result = await service.getSchoolForMigration(userId, targetExternalId, officialSchoolNumber);

				expect(result).toBeNull();
			});
		});

		describe('when the school number from the external system is not the same as the school number of the users school', () => {
			const setup = () => {
				const officialSchoolNumber = 'officialSchoolNumber';
				const otherOfficialSchoolNumber = 'notTheSameOfficialSchoolNumber';
				const sourceExternalId = 'sourceExternalId';
				const targetExternalId = 'targetExternalId';
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({
					id: 'schoolId',
					name: 'schoolName',
					officialSchoolNumber,
					externalId: sourceExternalId,
				});

				const user: UserDO = userDoFactory.build({ id: new ObjectId().toHexString(), schoolId: school.id });

				userService.findById.mockResolvedValue(user);
				schoolService.getSchoolById.mockResolvedValue(school);

				return {
					userId: user.id as string,
					user,
					officialSchoolNumber,
					otherOfficialSchoolNumber,
					school,
					targetExternalId,
				};
			};

			it('should throw a school number mismatch error', async () => {
				const { userId, targetExternalId, officialSchoolNumber, otherOfficialSchoolNumber } = setup();

				await expect(
					service.getSchoolForMigration(userId, targetExternalId, otherOfficialSchoolNumber)
				).rejects.toThrow(new SchoolNumberMismatchLoggableException(officialSchoolNumber, otherOfficialSchoolNumber));
			});
		});
	});

	describe('markUnmigratedUsersAsOutdated', () => {
		describe('when admin completes the migration', () => {
			const setup = () => {
				const closedAt: Date = new Date('2023-05-01');

				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId: new ObjectId().toHexString(),
					targetSystemId: new ObjectId().toHexString(),
					startedAt: new Date('2023-05-01'),
					closedAt,
					finishedAt: new Date('2023-05-01'),
				});

				const users: UserDO[] = userDoFactory.buildListWithId(3, { outdatedSince: undefined });

				userService.findUsers.mockResolvedValue(new Page(users, users.length));

				return {
					closedAt,
					userLoginMigration,
				};
			};

			it('should save migrated user with removed outdatedSince entry', async () => {
				const { closedAt, userLoginMigration } = setup();

				await service.markUnmigratedUsersAsOutdated(userLoginMigration);

				expect(userService.saveAll).toHaveBeenCalledWith([
					expect.objectContaining<Partial<UserDO>>({ outdatedSince: closedAt }),
					expect.objectContaining<Partial<UserDO>>({ outdatedSince: closedAt }),
					expect.objectContaining<Partial<UserDO>>({ outdatedSince: closedAt }),
				]);
			});
		});
	});

	describe('unmarkOutdatedUsers', () => {
		describe('when admin restarts the migration', () => {
			const setup = () => {
				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2023-05-01'),
					closedAt: new Date('2023-05-01'),
					finishedAt: new Date('2023-05-01'),
				});

				const users: UserDO[] = userDoFactory.buildListWithId(3, { outdatedSince: new Date('2023-05-02') });

				userService.findUsers.mockResolvedValue(new Page(users, users.length));

				return {
					userLoginMigration,
				};
			};

			it('should save migrated user with removed outdatedSince entry', async () => {
				const { userLoginMigration } = setup();

				await service.unmarkOutdatedUsers(userLoginMigration);

				expect(userService.saveAll).toHaveBeenCalledWith([
					expect.objectContaining<Partial<UserDO>>({ outdatedSince: undefined }),
					expect.objectContaining<Partial<UserDO>>({ outdatedSince: undefined }),
					expect.objectContaining<Partial<UserDO>>({ outdatedSince: undefined }),
				]);
			});
		});
	});

	describe('hasSchoolMigratedUser', () => {
		describe('when school will be loaded', () => {
			const setup = () => {
				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build();
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);

				return {
					userLoginMigration,
				};
			};

			it('should find user login migration by school id', async () => {
				setup();

				await service.hasSchoolMigratedUser('schoolId');

				expect(userLoginMigrationRepo.findBySchoolId).toHaveBeenCalledWith('schoolId');
			});
		});

		describe('when users will be loaded', () => {
			const setup = () => {
				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build();
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);
				userService.findUsers.mockResolvedValue(new Page([userDoFactory.build()], 1));

				return {
					userLoginMigration,
				};
			};

			it('should call user service to find users', async () => {
				const { userLoginMigration } = setup();

				await service.hasSchoolMigratedUser('schoolId');

				expect(userService.findUsers).toHaveBeenCalledWith({
					lastLoginSystemChangeBetweenStart: userLoginMigration.startedAt,
					lastLoginSystemChangeBetweenEnd: userLoginMigration.closedAt,
				});
			});
		});

		describe('when the school has no migration', () => {
			const setup = () => {
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);
			};

			it('should return false', async () => {
				setup();

				const result = await service.hasSchoolMigratedUser('schoolId');

				expect(result).toBe(false);
			});
		});

		describe('when the school has migrated user', () => {
			const setup = () => {
				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build();
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);
				userService.findUsers.mockResolvedValue(new Page([userDoFactory.build()], 1));
			};

			it('should return true', async () => {
				setup();

				const result = await service.hasSchoolMigratedUser('schoolId');

				expect(result).toBe(true);
			});
		});

		describe('when the school has no migrated user', () => {
			const setup = () => {
				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build();
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);
				userService.findUsers.mockResolvedValue(new Page([], 0));
			};

			it('should return false', async () => {
				setup();

				const result = await service.hasSchoolMigratedUser('schoolId');

				expect(result).toBe(false);
			});
		});
	});
});
