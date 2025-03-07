import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ObjectId } from '@mikro-orm/mongodb';
import { LegacySchoolService } from '@modules/legacy-school';
import { LegacySchoolDo } from '@modules/legacy-school/domain';
import { legacySchoolDoFactory } from '@modules/legacy-school/testing';
import { SchoolFeature } from '@modules/school/domain';
import { SystemService } from '@modules/system';
import { systemFactory } from '@modules/system/testing';
import { UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { UserLoginMigrationDO } from '../domain';
import {
	IdenticalUserLoginMigrationSystemLoggableException,
	MoinSchuleSystemNotFoundLoggableException,
	UserLoginMigrationAlreadyClosedLoggableException,
	UserLoginMigrationGracePeriodExpiredLoggableException,
} from '../loggable';
import { UserLoginMigrationRepo } from '../repo';
import { userLoginMigrationDOFactory } from '../testing';
import { UserLoginMigrationService } from './user-login-migration.service';

describe(UserLoginMigrationService.name, () => {
	let module: TestingModule;
	let service: UserLoginMigrationService;

	let userService: DeepMocked<UserService>;
	let schoolService: DeepMocked<LegacySchoolService>;
	let systemService: DeepMocked<SystemService>;
	let userLoginMigrationRepo: DeepMocked<UserLoginMigrationRepo>;

	const mockedDate: Date = new Date('2023-05-02');
	const finishDate: Date = new Date(
		mockedDate.getTime() + (Configuration.get('MIGRATION_END_GRACE_PERIOD_MS') as number)
	);

	beforeAll(async () => {
		jest.useFakeTimers();
		jest.setSystemTime(mockedDate);

		module = await Test.createTestingModule({
			providers: [
				UserLoginMigrationService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: UserLoginMigrationRepo,
					useValue: createMock<UserLoginMigrationRepo>(),
				},
			],
		}).compile();

		service = module.get(UserLoginMigrationService);
		userService = module.get(UserService);
		schoolService = module.get(LegacySchoolService);
		systemService = module.get(SystemService);
		userLoginMigrationRepo = module.get(UserLoginMigrationRepo);
	});

	afterAll(async () => {
		jest.useRealTimers();
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findMigrationByUser', () => {
		describe('when using a query with user id and the users school is in migration and the user has not migrated yet', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.buildWithId(undefined, userId);

				const userLoginMigration = new UserLoginMigrationDO({
					schoolId: user.schoolId,
					startedAt: new Date('2023-04-08'),
					targetSystemId: 'targetSystemId',
				});

				userService.findById.mockResolvedValue(user);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);

				return {
					userId,
					userLoginMigration,
				};
			};

			describe('when the school has a system', () => {
				it('should return the users migration with a source system', async () => {
					const { userId, userLoginMigration } = setup();

					const result = await service.findMigrationByUser(userId);

					expect(result).toEqual<UserLoginMigrationDO>(userLoginMigration);
				});
			});
		});

		describe('when using a query with user id and the users school is in migration, but the user has already migrated', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.buildWithId({ lastLoginSystemChange: new Date('2023-04-06') }, userId);

				const userLoginMigration = new UserLoginMigrationDO({
					schoolId: user.schoolId,
					startedAt: new Date('2023-04-05'),
					targetSystemId: 'targetSystemId',
				});

				userService.findById.mockResolvedValue(user);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);

				return {
					userId,
					userLoginMigration,
				};
			};

			it('should return null', async () => {
				const { userId } = setup();

				const result = await service.findMigrationByUser(userId);

				expect(result).toBeNull();
			});
		});

		describe('when using a query with user id and there is no migration for the user', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.buildWithId(undefined, userId);

				userService.findById.mockResolvedValue(user);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);

				return {
					userId,
				};
			};

			it('should return null', async () => {
				const { userId } = setup();

				const result = await service.findMigrationByUser(userId);

				expect(result).toBeNull();
			});
		});
	});

	describe('startMigration', () => {
		describe('when schoolId is given', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const school = legacySchoolDoFactory.buildWithId(undefined, schoolId);

				const targetSystemId = new ObjectId().toHexString();
				const system = systemFactory.withOauthConfig().build({
					id: targetSystemId,
					alias: 'SANIS',
				});

				const userLoginMigrationDO = userLoginMigrationDOFactory.build({
					targetSystemId,
					schoolId,
					startedAt: mockedDate,
					closedAt: undefined,
					finishedAt: undefined,
				});

				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.find.mockResolvedValue([system]);
				userLoginMigrationRepo.save.mockResolvedValue(userLoginMigrationDO);

				return {
					schoolId,
					targetSystemId,
					userLoginMigrationDO,
				};
			};

			it('should call userLoginMigrationRepo', async () => {
				const { schoolId, userLoginMigrationDO } = setup();

				await service.startMigration(schoolId);

				expect(userLoginMigrationRepo.save).toHaveBeenCalledWith(userLoginMigrationDO);
			});

			it('should return UserLoginMigration with start date and target system', async () => {
				const { schoolId, targetSystemId } = setup();
				const expected = userLoginMigrationDOFactory.buildWithId({
					id: new ObjectId().toHexString(),
					targetSystemId,
					schoolId,
					startedAt: mockedDate,
				});
				userLoginMigrationRepo.save.mockResolvedValue(expected);

				const result = await service.startMigration(schoolId);

				expect(result).toEqual(expected);
			});
		});

		describe('when the school has systems', () => {
			const setup = () => {
				const sourceSystemId = new ObjectId().toHexString();
				const targetSystemId = new ObjectId().toHexString();
				const system = systemFactory.withOauthConfig().build({
					id: targetSystemId,
					alias: 'SANIS',
				});

				const schoolId = new ObjectId().toHexString();
				const school = legacySchoolDoFactory.buildWithId({ systems: [sourceSystemId] }, schoolId);

				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.find.mockResolvedValue([system]);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);

				return {
					schoolId,
					targetSystemId,
					sourceSystemId,
				};
			};

			it('should save the UserLoginMigration with start date, target system and source system', async () => {
				const { schoolId, targetSystemId, sourceSystemId } = setup();
				const expected = userLoginMigrationDOFactory.buildWithId({
					id: new ObjectId().toHexString(),
					sourceSystemId,
					targetSystemId,
					schoolId,
					startedAt: mockedDate,
				});
				userLoginMigrationRepo.save.mockResolvedValue(expected);

				const result = await service.startMigration(schoolId);

				expect(result).toEqual(expected);
			});
		});

		describe('when the school has schoolfeatures', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const school = legacySchoolDoFactory.buildWithId(undefined, schoolId);

				const targetSystemId = new ObjectId().toHexString();
				const system = systemFactory.withOauthConfig().build({
					id: targetSystemId,
					alias: 'SANIS',
				});

				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.find.mockResolvedValue([system]);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);

				return {
					schoolId,
					school,
				};
			};

			it('should add the OAUTH_PROVISIONING_ENABLED feature to the schools feature list', async () => {
				const { schoolId, school } = setup();
				const existingFeature = 'otherFeature' as SchoolFeature;
				school.features = [existingFeature];

				await service.startMigration(schoolId);

				expect(schoolService.save).toHaveBeenCalledWith(
					expect.objectContaining<Partial<LegacySchoolDo>>({
						features: [existingFeature, SchoolFeature.OAUTH_PROVISIONING_ENABLED],
					})
				);
			});
		});

		describe('when the school has no features yet', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const school = legacySchoolDoFactory.buildWithId({ features: undefined }, schoolId);

				const targetSystemId = new ObjectId().toHexString();
				const system = systemFactory.withOauthConfig().build({
					id: targetSystemId,
					alias: 'SANIS',
				});

				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.find.mockResolvedValue([system]);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);

				return {
					schoolId,
				};
			};

			it('should set the OAUTH_PROVISIONING_ENABLED feature for the school', async () => {
				const { schoolId } = setup();

				await service.startMigration(schoolId);

				expect(schoolService.save).toHaveBeenCalledWith(
					expect.objectContaining<Partial<LegacySchoolDo>>({
						features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
					})
				);
			});
		});

		describe('when creating a new migration but the SANIS system does not exist', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const school = legacySchoolDoFactory.buildWithId(undefined, schoolId);

				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.find.mockResolvedValue([]);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);

				return {
					schoolId,
				};
			};

			it('should throw a MoinSchuleSystemNotFoundLoggableException', async () => {
				const { schoolId } = setup();

				const func = async () => service.startMigration(schoolId);

				await expect(func).rejects.toThrow(new MoinSchuleSystemNotFoundLoggableException());
			});
		});

		describe('when creating a new migration but the SANIS system and schools login system are the same', () => {
			const setup = () => {
				const targetSystemId = new ObjectId().toHexString();
				const system = systemFactory.withOauthConfig().build({
					id: targetSystemId,
					alias: 'SANIS',
				});

				const schoolId = new ObjectId().toHexString();
				const school = legacySchoolDoFactory.buildWithId({ systems: [targetSystemId] }, schoolId);

				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.find.mockResolvedValue([system]);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);

				return {
					schoolId,
					targetSystemId,
				};
			};

			it('should throw an IdenticalUserLoginMigrationSystemLoggableException', async () => {
				const { schoolId, targetSystemId } = setup();

				const func = async () => service.startMigration(schoolId);

				await expect(func).rejects.toThrow(
					new IdenticalUserLoginMigrationSystemLoggableException(schoolId, targetSystemId)
				);
			});
		});
	});

	describe('findMigrationBySchool', () => {
		describe('when a UserLoginMigration exists for the school', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();

				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					id: new ObjectId().toHexString(),
					schoolId,
					targetSystemId: 'targetSystemId',
					startedAt: mockedDate,
					mandatorySince: mockedDate,
					closedAt: mockedDate,
					finishedAt: finishDate,
				});

				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);

				return {
					schoolId,
					userLoginMigration,
				};
			};

			it('should return the UserLoginMigration', async () => {
				const { schoolId, userLoginMigration } = setup();

				const result = await service.findMigrationBySchool(schoolId);

				expect(result).toEqual(userLoginMigration);
			});
		});

		describe('when no UserLoginMigration exists for the school', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();

				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);

				return {
					schoolId,
				};
			};

			it('should return null', async () => {
				const { schoolId } = setup();

				const result = await service.findMigrationBySchool(schoolId);

				expect(result).toBeNull();
			});
		});
	});

	describe('deleteUserLoginMigration', () => {
		describe('when a userLoginMigration is given', () => {
			const setup = () => {
				const userLoginMigration = userLoginMigrationDOFactory.build();

				return {
					userLoginMigration,
				};
			};

			it('should call userLoginMigrationRepo.delete', async () => {
				const { userLoginMigration } = setup();

				await service.deleteUserLoginMigration({ ...userLoginMigration });

				expect(userLoginMigrationRepo.delete).toHaveBeenCalledWith(userLoginMigration);
			});
		});
	});

	describe('restartMigration', () => {
		describe('when the migration can be restarted', () => {
			const setup = () => {
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					startedAt: mockedDate,
					closedAt: mockedDate,
					finishedAt: finishDate,
				});
				const restartedUserLoginMigration = new UserLoginMigrationDO({
					...userLoginMigration,
					closedAt: undefined,
					finishedAt: undefined,
				});

				userLoginMigrationRepo.save.mockResolvedValueOnce(restartedUserLoginMigration);

				return {
					userLoginMigration,
					restartedUserLoginMigration,
				};
			};

			it('should save the migration without closedAt and finishedAt timestamps', async () => {
				const { userLoginMigration, restartedUserLoginMigration } = setup();

				await service.restartMigration({ ...userLoginMigration });

				expect(userLoginMigrationRepo.save).toHaveBeenCalledWith(restartedUserLoginMigration);
			});

			it('should return the migration', async () => {
				const { userLoginMigration, restartedUserLoginMigration } = setup();

				const result = await service.restartMigration({ ...userLoginMigration });

				expect(result).toEqual(restartedUserLoginMigration);
			});
		});

		describe('when the migration is still running', () => {
			const setup = () => {
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					startedAt: mockedDate,
				});

				return {
					userLoginMigration,
				};
			};

			it('should not save the migration again', async () => {
				const { userLoginMigration } = setup();

				await service.restartMigration({ ...userLoginMigration });

				expect(userLoginMigrationRepo.save).not.toHaveBeenCalled();
			});

			it('should return the migration', async () => {
				const { userLoginMigration } = setup();

				const result = await service.restartMigration({ ...userLoginMigration });

				expect(result).toEqual(userLoginMigration);
			});
		});

		describe('when the grace period for the user login migration is expired', () => {
			const setup = () => {
				const dateInThePast = new Date(mockedDate.getTime() - 100);
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					closedAt: dateInThePast,
					finishedAt: dateInThePast,
				});

				return {
					userLoginMigration,
					dateInThePast,
				};
			};

			it('should not save the user login migration again', async () => {
				const { userLoginMigration } = setup();

				await expect(service.restartMigration({ ...userLoginMigration })).rejects.toThrow();

				expect(userLoginMigrationRepo.save).not.toHaveBeenCalled();
			});

			it('should return throw an error', async () => {
				const { userLoginMigration, dateInThePast } = setup();

				await expect(service.restartMigration({ ...userLoginMigration })).rejects.toThrow(
					new UserLoginMigrationGracePeriodExpiredLoggableException(userLoginMigration.id as string, dateInThePast)
				);
			});
		});
	});

	describe('setMigrationMandatory', () => {
		describe('when migration is set to mandatory', () => {
			const setup = () => {
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					startedAt: mockedDate,
					mandatorySince: undefined,
				});

				userLoginMigrationRepo.save.mockResolvedValue(userLoginMigration);

				return {
					userLoginMigration,
				};
			};

			it('should call save the user login migration', async () => {
				const { userLoginMigration } = setup();

				await service.setMigrationMandatory(userLoginMigration, true);

				expect(userLoginMigrationRepo.save).toHaveBeenCalledWith({
					...userLoginMigration,
					mandatorySince: mockedDate,
				});
			});
		});

		describe('when migration is set to optional', () => {
			const setup = () => {
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					startedAt: mockedDate,
					mandatorySince: mockedDate,
				});

				return {
					userLoginMigration,
				};
			};

			it('should call save the user login migration', async () => {
				const { userLoginMigration } = setup();

				await service.setMigrationMandatory(userLoginMigration, false);

				expect(userLoginMigrationRepo.save).toHaveBeenCalledWith({
					...userLoginMigration,
					mandatorySince: undefined,
				});
			});
		});

		describe('when the grace period for the user login migration is expired', () => {
			const setup = () => {
				const dateInThePast = new Date(mockedDate.getTime() - 100);
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					closedAt: dateInThePast,
					finishedAt: dateInThePast,
				});

				return {
					userLoginMigration,
					dateInThePast,
				};
			};

			it('should not save the user login migration again', async () => {
				const { userLoginMigration } = setup();

				await expect(service.setMigrationMandatory({ ...userLoginMigration }, true)).rejects.toThrow();

				expect(userLoginMigrationRepo.save).not.toHaveBeenCalled();
			});

			it('should return throw an error', async () => {
				const { userLoginMigration, dateInThePast } = setup();

				await expect(service.setMigrationMandatory({ ...userLoginMigration }, true)).rejects.toThrow(
					new UserLoginMigrationGracePeriodExpiredLoggableException(userLoginMigration.id as string, dateInThePast)
				);
			});
		});

		describe('when migration is closed', () => {
			const setup = () => {
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					closedAt: new Date(2023, 5),
				});

				return {
					userLoginMigration,
				};
			};

			it('should throw a UserLoginMigrationAlreadyClosedLoggableException', async () => {
				const { userLoginMigration } = setup();

				const func = async () => service.setMigrationMandatory(userLoginMigration, true);

				await expect(func).rejects.toThrow(UserLoginMigrationAlreadyClosedLoggableException);
			});
		});
	});

	describe('closeMigration', () => {
		describe('when a migration can be closed', () => {
			const setup = () => {
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId();
				const closedUserLoginMigration = new UserLoginMigrationDO({
					...userLoginMigration,
					closedAt: mockedDate,
					finishedAt: finishDate,
				});

				userLoginMigrationRepo.save.mockResolvedValue(closedUserLoginMigration);

				return {
					userLoginMigration,
					closedUserLoginMigration,
				};
			};

			it('should remove the "ldap sync during migration" school feature', async () => {
				const { userLoginMigration } = setup();

				await service.closeMigration({ ...userLoginMigration });

				expect(schoolService.removeFeature).toHaveBeenCalledWith(
					userLoginMigration.schoolId,
					SchoolFeature.ENABLE_LDAP_SYNC_DURING_MIGRATION
				);
			});

			it('should save the closed user login migration', async () => {
				const { userLoginMigration, closedUserLoginMigration } = setup();

				await service.closeMigration({ ...userLoginMigration });

				expect(userLoginMigrationRepo.save).toHaveBeenCalledWith(closedUserLoginMigration);
			});

			it('should return the closed user login migration', async () => {
				const { userLoginMigration, closedUserLoginMigration } = setup();

				const result = await service.closeMigration({ ...userLoginMigration });

				expect(result).toEqual(closedUserLoginMigration);
			});
		});

		describe('when the user login migration was already closed', () => {
			const setup = () => {
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					closedAt: mockedDate,
					finishedAt: finishDate,
				});

				return {
					userLoginMigration,
				};
			};

			it('should not save the user login migration again', async () => {
				const { userLoginMigration } = setup();

				await service.closeMigration({ ...userLoginMigration });

				expect(userLoginMigrationRepo.save).not.toHaveBeenCalled();
			});

			it('should return the already closed user login migration', async () => {
				const { userLoginMigration } = setup();

				const result = await service.closeMigration({ ...userLoginMigration });

				expect(result).toEqual(userLoginMigration);
			});
		});

		describe('when the grace period for the user login migration is expired', () => {
			const setup = () => {
				const dateInThePast = new Date(mockedDate.getTime() - 100);
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					closedAt: dateInThePast,
					finishedAt: dateInThePast,
				});

				return {
					userLoginMigration,
					dateInThePast,
				};
			};

			it('should not save the user login migration again', async () => {
				const { userLoginMigration } = setup();

				await expect(service.closeMigration({ ...userLoginMigration })).rejects.toThrow();

				expect(userLoginMigrationRepo.save).not.toHaveBeenCalled();
			});

			it('should return throw an error', async () => {
				const { userLoginMigration, dateInThePast } = setup();

				await expect(service.closeMigration({ ...userLoginMigration })).rejects.toThrow(
					new UserLoginMigrationGracePeriodExpiredLoggableException(userLoginMigration.id as string, dateInThePast)
				);
			});
		});
	});

	describe('hasMigrationClosed', () => {
		describe('when migration is closed', () => {
			const setup = () => {
				const closedAt = new Date();
				closedAt.setMonth(closedAt.getMonth() - 1);
				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					closedAt,
				});

				return {
					userLoginMigration,
				};
			};

			it('should return true', () => {
				const { userLoginMigration } = setup();

				const result = service.hasMigrationClosed(userLoginMigration);

				expect(result).toEqual(true);
			});
		});

		describe('when migration is not closed', () => {
			const setup = () => {
				const closedAt = undefined;
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					closedAt,
				});

				return {
					userLoginMigration,
				};
			};

			it('should return false', () => {
				const { userLoginMigration } = setup();

				const result = service.hasMigrationClosed(userLoginMigration);

				expect(result).toEqual(false);
			});
		});

		describe('when "closedAt" exists but has not passed', () => {
			const setup = () => {
				const closedAt = new Date();
				closedAt.setMonth(closedAt.getMonth() + 1);
				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					closedAt,
				});

				return {
					userLoginMigration,
				};
			};

			it('should return false', () => {
				const { userLoginMigration } = setup();

				const result = service.hasMigrationClosed(userLoginMigration);

				expect(result).toEqual(false);
			});
		});
	});
});
