import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ObjectId } from '@mikro-orm/mongodb';
import { LegacySchoolService } from '@modules/legacy-school';
import { LegacySystemService } from '@modules/system';
import { SystemDto } from '@modules/system/service';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacySchoolDo, UserDO, UserLoginMigrationDO } from '@shared/domain/domainobject';
import { EntityId, SchoolFeature } from '@shared/domain/types';
import { UserLoginMigrationRepo } from '@shared/repo';
import { legacySchoolDoFactory, userDoFactory, userLoginMigrationDOFactory } from '@shared/testing/factory';
import {
	IdenticalUserLoginMigrationSystemLoggableException,
	MoinSchuleSystemNotFoundLoggableException,
	UserLoginMigrationAlreadyClosedLoggableException,
	UserLoginMigrationGracePeriodExpiredLoggableException,
} from '../loggable';
import { UserLoginMigrationService } from './user-login-migration.service';

describe(UserLoginMigrationService.name, () => {
	let module: TestingModule;
	let service: UserLoginMigrationService;

	let userService: DeepMocked<UserService>;
	let schoolService: DeepMocked<LegacySchoolService>;
	let systemService: DeepMocked<LegacySystemService>;
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
					provide: LegacySystemService,
					useValue: createMock<LegacySystemService>(),
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
		systemService = module.get(LegacySystemService);
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
				const userId: string = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId(undefined, userId);

				const userLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
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

					const result: UserLoginMigrationDO | null = await service.findMigrationByUser(userId);

					expect(result).toEqual<UserLoginMigrationDO>(userLoginMigration);
				});
			});
		});

		describe('when using a query with user id and the users school is in migration, but the user has already migrated', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId({ lastLoginSystemChange: new Date('2023-04-06') }, userId);

				const userLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
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

				const result: UserLoginMigrationDO | null = await service.findMigrationByUser(userId);

				expect(result).toBeNull();
			});
		});

		describe('when using a query with user id and there is no migration for the user', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId(undefined, userId);

				userService.findById.mockResolvedValue(user);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);

				return {
					userId,
				};
			};

			it('should return null', async () => {
				const { userId } = setup();

				const result: UserLoginMigrationDO | null = await service.findMigrationByUser(userId);

				expect(result).toBeNull();
			});
		});
	});

	describe('startMigration', () => {
		describe('when schoolId is given', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId(undefined, schoolId);

				const targetSystemId: EntityId = new ObjectId().toHexString();
				const system: SystemDto = new SystemDto({
					id: targetSystemId,
					type: 'oauth2',
					alias: 'SANIS',
				});

				const userLoginMigrationDO: UserLoginMigrationDO = userLoginMigrationDOFactory.build({
					targetSystemId,
					schoolId,
					startedAt: mockedDate,
					closedAt: undefined,
					finishedAt: undefined,
				});

				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.findByType.mockResolvedValue([system]);
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
				const expected: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					id: new ObjectId().toHexString(),
					targetSystemId,
					schoolId,
					startedAt: mockedDate,
				});
				userLoginMigrationRepo.save.mockResolvedValue(expected);

				const result: UserLoginMigrationDO = await service.startMigration(schoolId);

				expect(result).toEqual(expected);
			});
		});

		describe('when the school has systems', () => {
			const setup = () => {
				const sourceSystemId: EntityId = new ObjectId().toHexString();
				const targetSystemId: EntityId = new ObjectId().toHexString();
				const system: SystemDto = new SystemDto({
					id: targetSystemId,
					type: 'oauth2',
					alias: 'SANIS',
				});

				const schoolId: EntityId = new ObjectId().toHexString();
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({ systems: [sourceSystemId] }, schoolId);

				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.findByType.mockResolvedValue([system]);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);

				return {
					schoolId,
					targetSystemId,
					sourceSystemId,
				};
			};

			it('should save the UserLoginMigration with start date, target system and source system', async () => {
				const { schoolId, targetSystemId, sourceSystemId } = setup();
				const expected: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					id: new ObjectId().toHexString(),
					sourceSystemId,
					targetSystemId,
					schoolId,
					startedAt: mockedDate,
				});
				userLoginMigrationRepo.save.mockResolvedValue(expected);

				const result: UserLoginMigrationDO = await service.startMigration(schoolId);

				expect(result).toEqual(expected);
			});
		});

		describe('when the school has schoolfeatures', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId(undefined, schoolId);

				const targetSystemId: EntityId = new ObjectId().toHexString();
				const system: SystemDto = new SystemDto({
					id: targetSystemId,
					type: 'oauth2',
					alias: 'SANIS',
				});

				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.findByType.mockResolvedValue([system]);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);

				return {
					schoolId,
					school,
				};
			};

			it('should add the OAUTH_PROVISIONING_ENABLED feature to the schools feature list', async () => {
				const { schoolId, school } = setup();
				const existingFeature: SchoolFeature = 'otherFeature' as SchoolFeature;
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
				const schoolId: EntityId = new ObjectId().toHexString();
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({ features: undefined }, schoolId);

				const targetSystemId: EntityId = new ObjectId().toHexString();
				const system: SystemDto = new SystemDto({
					id: targetSystemId,
					type: 'oauth2',
					alias: 'SANIS',
				});

				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.findByType.mockResolvedValue([system]);
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
				const schoolId: EntityId = new ObjectId().toHexString();
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId(undefined, schoolId);

				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.findByType.mockResolvedValue([]);
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
				const targetSystemId: EntityId = new ObjectId().toHexString();
				const system: SystemDto = new SystemDto({
					id: targetSystemId,
					type: 'oauth2',
					alias: 'SANIS',
				});

				const schoolId: EntityId = new ObjectId().toHexString();
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({ systems: [targetSystemId] }, schoolId);

				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.findByType.mockResolvedValue([system]);
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

				const result: UserLoginMigrationDO | null = await service.findMigrationBySchool(schoolId);

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

				const result: UserLoginMigrationDO | null = await service.findMigrationBySchool(schoolId);

				expect(result).toBeNull();
			});
		});
	});

	describe('deleteUserLoginMigration', () => {
		describe('when a userLoginMigration is given', () => {
			const setup = () => {
				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build();

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
				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					startedAt: mockedDate,
					closedAt: mockedDate,
					finishedAt: finishDate,
				});
				const restartedUserLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
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

				const result: UserLoginMigrationDO = await service.restartMigration({ ...userLoginMigration });

				expect(result).toEqual(restartedUserLoginMigration);
			});
		});

		describe('when the migration is still running', () => {
			const setup = () => {
				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
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

				const result: UserLoginMigrationDO = await service.restartMigration({ ...userLoginMigration });

				expect(result).toEqual(userLoginMigration);
			});
		});

		describe('when the grace period for the user login migration is expired', () => {
			const setup = () => {
				const dateInThePast: Date = new Date(mockedDate.getTime() - 100);
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
				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
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
				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
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
				const dateInThePast: Date = new Date(mockedDate.getTime() - 100);
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
				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
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

				const result: UserLoginMigrationDO = await service.closeMigration({ ...userLoginMigration });

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

				const result: UserLoginMigrationDO = await service.closeMigration({ ...userLoginMigration });

				expect(result).toEqual(userLoginMigration);
			});
		});

		describe('when the grace period for the user login migration is expired', () => {
			const setup = () => {
				const dateInThePast: Date = new Date(mockedDate.getTime() - 100);
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
});
