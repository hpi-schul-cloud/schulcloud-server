import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ObjectId } from '@mikro-orm/mongodb';
import { InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, SchoolDO, SchoolFeatures, UserDO, UserLoginMigrationDO } from '@shared/domain';
import { UserLoginMigrationRepo } from '@shared/repo';
import { schoolDOFactory, userDoFactory } from '@shared/testing';
import { SchoolService } from '@src/modules/school';
import { SystemService } from '@src/modules/system';
import { SystemDto } from '@src/modules/system/service';
import { UserService } from '@src/modules/user';
import { UserLoginMigrationService } from './user-login-migration.service';
import { SchoolMigrationService } from './school-migration.service';
import { RestartUserLoginMigrationError } from '../error';

describe('UserLoginMigrationService', () => {
	let module: TestingModule;
	let service: UserLoginMigrationService;

	let userService: DeepMocked<UserService>;
	let schoolService: DeepMocked<SchoolService>;
	let systemService: DeepMocked<SystemService>;
	let userLoginMigrationRepo: DeepMocked<UserLoginMigrationRepo>;
	let schoolMigrationService: DeepMocked<SchoolMigrationService>;

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
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: UserLoginMigrationRepo,
					useValue: createMock<UserLoginMigrationRepo>(),
				},
				{
					provide: SchoolMigrationService,
					useValue: createMock<SchoolMigrationService>(),
				},
			],
		}).compile();

		service = module.get(UserLoginMigrationService);
		userService = module.get(UserService);
		schoolService = module.get(SchoolService);
		systemService = module.get(SystemService);
		userLoginMigrationRepo = module.get(UserLoginMigrationRepo);
		schoolMigrationService = module.get(SchoolMigrationService);
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

	describe('setMigration is called', () => {
		describe('when first starting the migration', () => {
			describe('when the school has no systems', () => {
				const setup = () => {
					const schoolId: EntityId = new ObjectId().toHexString();
					const school: SchoolDO = schoolDOFactory.buildWithId(undefined, schoolId);

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
						targetSystemId,
					};
				};

				it('should save the UserLoginMigration with start date and target system', async () => {
					const { schoolId, targetSystemId } = setup();
					const expected: UserLoginMigrationDO = new UserLoginMigrationDO({
						id: new ObjectId().toHexString(),
						targetSystemId,
						schoolId,
						startedAt: mockedDate,
					});
					userLoginMigrationRepo.save.mockResolvedValue(expected);

					const result: UserLoginMigrationDO = await service.setMigration(schoolId, true);

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
					const school: SchoolDO = schoolDOFactory.buildWithId({ systems: [sourceSystemId] }, schoolId);

					schoolService.getSchoolById.mockResolvedValue(school);
					systemService.findByType.mockResolvedValue([system]);
					userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);

					return {
						schoolId,
						school,
						targetSystemId,
						sourceSystemId,
					};
				};

				it('should save the UserLoginMigration with start date, target system and source system', async () => {
					const { schoolId, targetSystemId, sourceSystemId } = setup();
					const expected: UserLoginMigrationDO = new UserLoginMigrationDO({
						id: new ObjectId().toHexString(),
						sourceSystemId,
						targetSystemId,
						schoolId,
						startedAt: mockedDate,
					});
					userLoginMigrationRepo.save.mockResolvedValue(expected);

					const result: UserLoginMigrationDO = await service.setMigration(schoolId, true);

					expect(result).toEqual(expected);
				});
			});

			describe('when the school has a feature', () => {
				const setup = () => {
					const schoolId: EntityId = new ObjectId().toHexString();
					const school: SchoolDO = schoolDOFactory.buildWithId(undefined, schoolId);

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
						targetSystemId,
					};
				};

				it('should add the OAUTH_PROVISIONING_ENABLED feature to the schools feature list', async () => {
					const { schoolId, school } = setup();
					const existingFeature: SchoolFeatures = 'otherFeature' as SchoolFeatures;
					school.features = [existingFeature];

					await service.setMigration(schoolId, true, undefined, undefined);

					expect(schoolService.save).toHaveBeenCalledWith(
						expect.objectContaining<Partial<SchoolDO>>({
							features: [existingFeature, SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
						})
					);
				});
			});

			describe('when the school has no features yet', () => {
				const setup = () => {
					const schoolId: EntityId = new ObjectId().toHexString();
					const school: SchoolDO = schoolDOFactory.buildWithId({ features: undefined }, schoolId);

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
						targetSystemId,
					};
				};

				it('should set the OAUTH_PROVISIONING_ENABLED feature for the school', async () => {
					const { schoolId } = setup();

					await service.setMigration(schoolId, true, undefined, undefined);

					expect(schoolService.save).toHaveBeenCalledWith(
						expect.objectContaining<Partial<SchoolDO>>({
							features: [SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
						})
					);
				});
			});

			describe('when modifying a migration that does not exist on the school', () => {
				const setup = () => {
					const schoolId: EntityId = new ObjectId().toHexString();
					const school: SchoolDO = schoolDOFactory.buildWithId(undefined, schoolId);

					schoolService.getSchoolById.mockResolvedValue(school);
					userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);

					return {
						schoolId,
						school,
					};
				};

				it('should throw an UnprocessableEntityException', async () => {
					const { schoolId } = setup();

					const func = async () => service.setMigration(schoolId, undefined, true, true);

					await expect(func).rejects.toThrow(UnprocessableEntityException);
				});
			});

			describe('when creating a new migration but the SANIS system does not exist', () => {
				const setup = () => {
					const schoolId: EntityId = new ObjectId().toHexString();
					const school: SchoolDO = schoolDOFactory.buildWithId(undefined, schoolId);

					schoolService.getSchoolById.mockResolvedValue(school);
					systemService.findByType.mockResolvedValue([]);
					userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);

					return {
						schoolId,
						school,
					};
				};

				it('should throw an InternalServerErrorException', async () => {
					const { schoolId } = setup();

					const func = async () => service.setMigration(schoolId, true);

					await expect(func).rejects.toThrow(InternalServerErrorException);
				});
			});
		});

		describe('when restarting the migration', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const school: SchoolDO = schoolDOFactory.buildWithId(undefined, schoolId);

				const targetSystemId: EntityId = new ObjectId().toHexString();
				const system: SystemDto = new SystemDto({
					id: targetSystemId,
					type: 'oauth2',
					alias: 'SANIS',
				});

				const userLoginMigrationId: EntityId = new ObjectId().toHexString();
				const userLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
					id: userLoginMigrationId,
					targetSystemId,
					schoolId,
					startedAt: mockedDate,
					closedAt: mockedDate,
					finishedAt: finishDate,
				});

				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.findByType.mockResolvedValue([system]);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);

				return {
					schoolId,
					userLoginMigration,
				};
			};

			it('should save the UserLoginMigration without close date and finish date', async () => {
				const { schoolId, userLoginMigration } = setup();
				const expected: UserLoginMigrationDO = new UserLoginMigrationDO({
					...userLoginMigration,
					closedAt: undefined,
					finishedAt: undefined,
				});
				userLoginMigrationRepo.save.mockResolvedValue(expected);

				const result: UserLoginMigrationDO = await service.setMigration(schoolId, true, undefined, false);

				expect(result).toEqual(expected);
			});
		});

		describe('when setting the migration to mandatory', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const school: SchoolDO = schoolDOFactory.buildWithId(undefined, schoolId);

				const targetSystemId: EntityId = new ObjectId().toHexString();
				const system: SystemDto = new SystemDto({
					id: targetSystemId,
					type: 'oauth2',
					alias: 'SANIS',
				});

				const userLoginMigrationId: EntityId = new ObjectId().toHexString();
				const userLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
					id: userLoginMigrationId,
					targetSystemId,
					schoolId,
					startedAt: mockedDate,
				});

				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.findByType.mockResolvedValue([system]);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);

				return {
					schoolId,
					userLoginMigration,
				};
			};

			it('should save the UserLoginMigration with mandatory date', async () => {
				const { schoolId, userLoginMigration } = setup();
				const expected: UserLoginMigrationDO = new UserLoginMigrationDO({
					...userLoginMigration,
					mandatorySince: mockedDate,
				});
				userLoginMigrationRepo.save.mockResolvedValue(expected);

				const result: UserLoginMigrationDO = await service.setMigration(schoolId, undefined, true);

				expect(result).toEqual(expected);
			});
		});

		describe('when setting the migration back to optional', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const school: SchoolDO = schoolDOFactory.buildWithId(undefined, schoolId);

				const targetSystemId: EntityId = new ObjectId().toHexString();
				const system: SystemDto = new SystemDto({
					id: targetSystemId,
					type: 'oauth2',
					alias: 'SANIS',
				});

				const userLoginMigrationId: EntityId = new ObjectId().toHexString();
				const userLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
					id: userLoginMigrationId,
					targetSystemId,
					schoolId,
					startedAt: mockedDate,
					mandatorySince: mockedDate,
				});

				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.findByType.mockResolvedValue([system]);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);

				return {
					schoolId,
					userLoginMigration,
				};
			};

			it('should save the UserLoginMigration without mandatory date', async () => {
				const { schoolId, userLoginMigration } = setup();
				const expected: UserLoginMigrationDO = new UserLoginMigrationDO({
					...userLoginMigration,
					mandatorySince: undefined,
				});
				userLoginMigrationRepo.save.mockResolvedValue(expected);

				const result: UserLoginMigrationDO = await service.setMigration(schoolId, undefined, false);

				expect(result).toEqual(expected);
			});
		});

		describe('when closing the migration', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const school: SchoolDO = schoolDOFactory.buildWithId(undefined, schoolId);

				const targetSystemId: EntityId = new ObjectId().toHexString();
				const system: SystemDto = new SystemDto({
					id: targetSystemId,
					type: 'oauth2',
					alias: 'SANIS',
				});

				const userLoginMigrationId: EntityId = new ObjectId().toHexString();
				const userLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
					id: userLoginMigrationId,
					targetSystemId,
					schoolId,
					startedAt: mockedDate,
				});

				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.findByType.mockResolvedValue([system]);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);

				return {
					schoolId,
					userLoginMigration,
				};
			};

			it('should save the UserLoginMigration with close date and finish date', async () => {
				const { schoolId, userLoginMigration } = setup();
				const expected: UserLoginMigrationDO = new UserLoginMigrationDO({
					...userLoginMigration,
					closedAt: mockedDate,
					finishedAt: finishDate,
				});
				userLoginMigrationRepo.save.mockResolvedValue(expected);

				const result: UserLoginMigrationDO = await service.setMigration(schoolId, undefined, undefined, true);

				expect(result).toEqual(expected);
			});
		});
	});

	describe('startMigration is called', () => {
		describe('when schoolId is given', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const school: SchoolDO = schoolDOFactory.buildWithId(undefined, schoolId);

				const targetSystemId: EntityId = new ObjectId().toHexString();
				const system: SystemDto = new SystemDto({
					id: targetSystemId,
					type: 'oauth2',
					alias: 'SANIS',
				});

				const userLoginMigrationDO: UserLoginMigrationDO = new UserLoginMigrationDO({
					targetSystemId,
					schoolId,
					startedAt: mockedDate,
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
				const expected: UserLoginMigrationDO = new UserLoginMigrationDO({
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
				const school: SchoolDO = schoolDOFactory.buildWithId({ systems: [sourceSystemId] }, schoolId);

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
				const expected: UserLoginMigrationDO = new UserLoginMigrationDO({
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
				const school: SchoolDO = schoolDOFactory.buildWithId(undefined, schoolId);

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
				const existingFeature: SchoolFeatures = 'otherFeature' as SchoolFeatures;
				school.features = [existingFeature];

				await service.startMigration(schoolId);

				expect(schoolService.save).toHaveBeenCalledWith(
					expect.objectContaining<Partial<SchoolDO>>({
						features: [existingFeature, SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
					})
				);
			});
		});

		describe('when the school has no features yet', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const school: SchoolDO = schoolDOFactory.buildWithId({ features: undefined }, schoolId);

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
					expect.objectContaining<Partial<SchoolDO>>({
						features: [SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
					})
				);
			});
		});

		describe('when creating a new migration but the SANIS system does not exist', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();
				const school: SchoolDO = schoolDOFactory.buildWithId(undefined, schoolId);

				schoolService.getSchoolById.mockResolvedValue(school);
				systemService.findByType.mockResolvedValue([]);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);

				return {
					schoolId,
				};
			};

			it('should throw an InternalServerErrorException', async () => {
				const { schoolId } = setup();

				const func = async () => service.startMigration(schoolId);

				await expect(func).rejects.toThrow(new InternalServerErrorException('Cannot find SANIS system'));
			});
		});
	});

	describe('findMigrationBySchool is called', () => {
		describe('when a UserLoginMigration exists for the school', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();

				const userLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
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

	describe('restartMigration is called', () => {
		describe('when migration restart was successfully', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();

				const targetSystemId: EntityId = new ObjectId().toHexString();

				const userLoginMigrationDO: UserLoginMigrationDO = new UserLoginMigrationDO({
					targetSystemId,
					schoolId,
					startedAt: mockedDate,
				});
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigrationDO);
				schoolMigrationService.unmarkOutdatedUsers.mockResolvedValue(Promise.resolve());
				userLoginMigrationRepo.save.mockResolvedValue(userLoginMigrationDO);

				return {
					schoolId,
					targetSystemId,
					userLoginMigrationDO,
				};
			};

			it('should call userLoginMigrationRepo', async () => {
				const { schoolId, userLoginMigrationDO } = setup();

				await service.restartMigration(schoolId);

				expect(userLoginMigrationRepo.findBySchoolId).toHaveBeenCalledWith(schoolId);
				expect(userLoginMigrationRepo.save).toHaveBeenCalledWith(userLoginMigrationDO);
			});

			it('should call schoolMigrationService', async () => {
				const { schoolId } = setup();

				await service.restartMigration(schoolId);

				expect(schoolMigrationService.unmarkOutdatedUsers).toHaveBeenCalledWith(schoolId);
			});
		});

		describe('when migration could not be found', () => {
			const setup = () => {
				const schoolId: EntityId = new ObjectId().toHexString();

				const targetSystemId: EntityId = new ObjectId().toHexString();

				const userLoginMigrationDO: UserLoginMigrationDO = new UserLoginMigrationDO({
					targetSystemId,
					schoolId,
					startedAt: mockedDate,
				});
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);

				return {
					schoolId,
					targetSystemId,
					userLoginMigrationDO,
				};
			};

			it('should throw RestartUserLoginMigrationError ', async () => {
				const { schoolId } = setup();

				await expect(service.restartMigration(schoolId)).rejects.toThrow(
					new RestartUserLoginMigrationError(`Migration for school with id ${schoolId} does not exist for restart.`)
				);
			});
		});
	});
});
