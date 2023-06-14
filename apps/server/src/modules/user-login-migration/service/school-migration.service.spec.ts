import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common';
import { UserLoginMigrationDO } from '@shared/domain';
import { Page } from '@shared/domain/domainobject/page';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { UserLoginMigrationRepo } from '@shared/repo/userloginmigration/user-login-migration.repo';
import { setupEntities, userDoFactory } from '@shared/testing';
import { schoolDOFactory } from '@shared/testing/factory/domainobject/school.factory';
import { LegacyLogger } from '@src/core/logger';
import { ICurrentUser } from '@src/modules/authentication';
import { SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';
import { OAuthMigrationError } from '@src/modules/user-login-migration/error/oauth-migration.error';
import { userLoginMigrationDOFactory } from '@shared/testing/factory/domainobject/user-login-migration.factory';
import { SchoolMigrationService } from './school-migration.service';

describe('SchoolMigrationService', () => {
	let module: TestingModule;
	let service: SchoolMigrationService;

	let userService: DeepMocked<UserService>;
	let schoolService: DeepMocked<SchoolService>;
	let userLoginMigrationRepo: DeepMocked<UserLoginMigrationRepo>;

	beforeAll(async () => {
		jest.useFakeTimers();

		module = await Test.createTestingModule({
			providers: [
				SchoolMigrationService,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
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
					provide: UserLoginMigrationRepo,
					useValue: createMock<UserLoginMigrationRepo>(),
				},
			],
		}).compile();

		service = module.get(SchoolMigrationService);
		schoolService = module.get(SchoolService);
		userService = module.get(UserService);
		userLoginMigrationRepo = module.get(UserLoginMigrationRepo);

		await setupEntities();
	});

	afterAll(async () => {
		jest.useRealTimers();
		await module.close();
	});

	describe('validateGracePeriod is called', () => {
		describe('when current date is before finish date', () => {
			const setup = () => {
				jest.setSystemTime(new Date('2023-05-01'));

				const userLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'systemId',
					startedAt: new Date('2023-05-01'),
					closedAt: new Date('2023-05-01'),
					finishedAt: new Date('2023-05-02'),
				});

				return {
					userLoginMigration,
				};
			};

			it('should not throw', () => {
				const { userLoginMigration } = setup();

				const func = () => service.validateGracePeriod(userLoginMigration);

				expect(func).not.toThrow();
			});
		});

		describe('when current date is after finish date', () => {
			const setup = () => {
				jest.setSystemTime(new Date('2023-05-03'));

				const userLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'systemId',
					startedAt: new Date('2023-05-01'),
					closedAt: new Date('2023-05-01'),
					finishedAt: new Date('2023-05-02'),
				});

				return {
					userLoginMigration,
				};
			};

			it('should throw validation error', () => {
				const { userLoginMigration } = setup();

				const func = () => service.validateGracePeriod(userLoginMigration);

				expect(func).toThrow(
					new ValidationError('grace_period_expired: The grace period after finishing migration has expired')
				);
			});
		});
	});

	describe('schoolToMigrate is called', () => {
		describe('when school number is missing', () => {
			const setup = () => {
				const schoolDO: SchoolDO = schoolDOFactory.buildWithId({
					id: 'schoolId',
					name: 'schoolName',
					officialSchoolNumber: 'officialSchoolNumber',
					externalId: 'firstExternalId',
				});

				const userDO: UserDO = userDoFactory.buildWithId({ schoolId: schoolDO.id }, new ObjectId().toHexString(), {});

				const currentUser: ICurrentUser = {
					userId: userDO.id,
					schoolId: userDO.schoolId,
					systemId: 'systemId',
				} as ICurrentUser;

				return {
					externalId: schoolDO.externalId as string,
					currentUser,
				};
			};

			it('should throw an error', async () => {
				const { currentUser, externalId } = setup();

				const func = () => service.schoolToMigrate(currentUser.userId, externalId, undefined);

				await expect(func()).rejects.toThrow(
					new OAuthMigrationError(
						'Official school number from target migration system is missing',
						'ext_official_school_number_missing'
					)
				);
			});
		});

		describe('when school could not be found with official school number', () => {
			const setup = () => {
				const schoolDO: SchoolDO = schoolDOFactory.buildWithId({
					id: 'schoolId',
					name: 'schoolName',
					officialSchoolNumber: 'officialSchoolNumber',
					externalId: 'firstExternalId',
				});

				const userDO: UserDO = userDoFactory.buildWithId({ schoolId: schoolDO.id }, new ObjectId().toHexString(), {});

				return {
					currentUserId: userDO.id as string,
					officialSchoolNumber: schoolDO.officialSchoolNumber,
					schoolDO,
					externalId: schoolDO.externalId as string,
					userDO,
				};
			};

			it('should throw an error', async () => {
				const { currentUserId, externalId, officialSchoolNumber, userDO, schoolDO } = setup();
				userService.findById.mockResolvedValue(userDO);
				schoolService.getSchoolById.mockResolvedValue(schoolDO);
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(null);

				const func = () => service.schoolToMigrate(currentUserId, externalId, officialSchoolNumber);

				await expect(func()).rejects.toThrow(
					new OAuthMigrationError(
						'Could not find school by official school number from target migration system',
						'ext_official_school_missing'
					)
				);
			});
		});

		describe('when current users school not match with school of to migrate user ', () => {
			const setup = () => {
				const schoolDO: SchoolDO = schoolDOFactory.buildWithId({
					id: 'schoolId',
					name: 'schoolName',
					officialSchoolNumber: 'officialSchoolNumber',
					externalId: 'firstExternalId',
				});

				const userDO: UserDO = userDoFactory.buildWithId({ schoolId: schoolDO.id }, new ObjectId().toHexString(), {});

				return {
					currentUserId: userDO.id as string,
					schoolDO,
					externalId: schoolDO.externalId as string,
					userDO,
				};
			};

			it('should throw an error', async () => {
				const { currentUserId, externalId, schoolDO, userDO } = setup();
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(schoolDO);
				schoolDO.officialSchoolNumber = 'OfficialSchoolnumberMismatch';
				schoolService.getSchoolById.mockResolvedValue(schoolDO);

				userService.findById.mockResolvedValue(userDO);

				const func = () => service.schoolToMigrate(currentUserId, externalId, 'targetSchoolNumber');

				await expect(func()).rejects.toThrow(
					new OAuthMigrationError(
						'Current users school is not the same as school found by official school number from target migration system',
						'ext_official_school_number_mismatch',
						'targetSchoolNumber',
						schoolDO.officialSchoolNumber
					)
				);
			});
		});

		describe('when school was already migrated', () => {
			const setup = () => {
				const schoolDO: SchoolDO = schoolDOFactory.buildWithId({
					id: 'schoolId',
					name: 'schoolName',
					officialSchoolNumber: 'officialSchoolNumber',
					externalId: 'firstExternalId',
				});

				const userDO: UserDO = userDoFactory.buildWithId({ schoolId: schoolDO.id }, new ObjectId().toHexString(), {});

				return {
					currentUserId: userDO.id as string,
					schoolDO,
					externalId: schoolDO.externalId as string,
					userDO,
				};
			};

			it('should return null ', async () => {
				const { currentUserId, externalId, schoolDO, userDO } = setup();
				userService.findById.mockResolvedValue(userDO);
				schoolService.getSchoolById.mockResolvedValue(schoolDO);
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(schoolDO);

				const result: SchoolDO | null = await service.schoolToMigrate(
					currentUserId,
					externalId,
					schoolDO.officialSchoolNumber
				);

				expect(result).toBeNull();
			});
		});

		describe('when school has to be migrated', () => {
			const setup = () => {
				const schoolDO: SchoolDO = schoolDOFactory.buildWithId({
					id: 'schoolId',
					name: 'schoolName',
					officialSchoolNumber: 'officialSchoolNumber',
					externalId: 'firstExternalId',
				});

				const userDO: UserDO = userDoFactory.buildWithId({ schoolId: schoolDO.id }, new ObjectId().toHexString(), {});

				return {
					currentUserId: userDO.id as string,
					schoolDO,
					userDO,
				};
			};

			it('should return migrated school', async () => {
				const { currentUserId, schoolDO, userDO } = setup();
				schoolService.getSchoolById.mockResolvedValue(schoolDO);
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(schoolDO);
				userService.findById.mockResolvedValue(userDO);

				const result: SchoolDO | null = await service.schoolToMigrate(
					currentUserId,
					'newExternalId',
					schoolDO.officialSchoolNumber
				);

				expect(result).toEqual(schoolDO);
			});
		});
	});

	describe('migrateSchool is called', () => {
		describe('when school will be migrated', () => {
			const setup = () => {
				const schoolDO: SchoolDO = schoolDOFactory.buildWithId({
					id: 'schoolId',
					name: 'schoolName',
					officialSchoolNumber: 'officialSchoolNumber',
					externalId: 'firstExternalId',
				});
				const targetSystemId = 'targetSystemId';

				return {
					schoolDO,
					targetSystemId,
					firstExternalId: schoolDO.externalId,
				};
			};

			it('should save the migrated school', async () => {
				const { schoolDO, targetSystemId, firstExternalId } = setup();
				const newExternalId = 'newExternalId';

				await service.migrateSchool(newExternalId, schoolDO, targetSystemId);

				expect(schoolService.save).toHaveBeenCalledWith(
					expect.objectContaining<Partial<SchoolDO>>({
						systems: [targetSystemId],
						previousExternalId: firstExternalId,
						externalId: newExternalId,
					})
				);
			});

			describe('when there are other systems before', () => {
				it('should add the system to migrated school', async () => {
					const { schoolDO, targetSystemId } = setup();
					schoolDO.systems = ['existingSystem'];

					await service.migrateSchool('newExternalId', schoolDO, targetSystemId);

					expect(schoolService.save).toHaveBeenCalledWith(
						expect.objectContaining<Partial<SchoolDO>>({
							systems: ['existingSystem', targetSystemId],
						})
					);
				});
			});

			describe('when there are no systems in School', () => {
				it('should add the system to migrated school', async () => {
					const { schoolDO, targetSystemId } = setup();
					schoolDO.systems = undefined;

					await service.migrateSchool('newExternalId', schoolDO, targetSystemId);

					expect(schoolService.save).toHaveBeenCalledWith(
						expect.objectContaining<Partial<SchoolDO>>({
							systems: [targetSystemId],
						})
					);
				});
			});

			describe('when an error occurred', () => {
				it('should save the old schoolDo (rollback the migration)', async () => {
					const { schoolDO, targetSystemId } = setup();
					schoolService.save.mockRejectedValueOnce(new Error());

					await service.migrateSchool('newExternalId', schoolDO, targetSystemId);

					expect(schoolService.save).toHaveBeenCalledWith(schoolDO);
				});
			});
		});
	});

	describe('markUnmigratedUsersAsOutdated', () => {
		describe('when admin completes the migration', () => {
			const setup = () => {
				const closedAt: Date = new Date('2023-05-01');

				const userLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2023-05-01'),
					closedAt,
					finishedAt: new Date('2023-05-01'),
				});

				const users: UserDO[] = userDoFactory.buildListWithId(3, { outdatedSince: undefined });

				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);
				userService.findUsers.mockResolvedValue(new Page(users, users.length));

				return {
					closedAt,
				};
			};

			it('should save migrated user with removed outdatedSince entry', async () => {
				const { closedAt } = setup();

				await service.markUnmigratedUsersAsOutdated('schoolId');

				expect(userService.saveAll).toHaveBeenCalledWith([
					expect.objectContaining<Partial<UserDO>>({ outdatedSince: closedAt }),
					expect.objectContaining<Partial<UserDO>>({ outdatedSince: closedAt }),
					expect.objectContaining<Partial<UserDO>>({ outdatedSince: closedAt }),
				]);
			});
		});

		describe('when the school has no migration', () => {
			const setup = () => {
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);
			};

			it('should throw an UnprocessableEntityException', async () => {
				setup();

				const func = async () => service.markUnmigratedUsersAsOutdated('schoolId');

				await expect(func).rejects.toThrow(UnprocessableEntityException);
			});
		});
	});

	describe('unmarkOutdatedUsers', () => {
		describe('when admin restarts the migration', () => {
			const setup = () => {
				const userLoginMigration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2023-05-01'),
					closedAt: new Date('2023-05-01'),
					finishedAt: new Date('2023-05-01'),
				});

				const users: UserDO[] = userDoFactory.buildListWithId(3, { outdatedSince: new Date('2023-05-02') });

				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);
				userService.findUsers.mockResolvedValue(new Page(users, users.length));
			};

			it('should save migrated user with removed outdatedSince entry', async () => {
				setup();

				await service.unmarkOutdatedUsers('schoolId');

				expect(userService.saveAll).toHaveBeenCalledWith([
					expect.objectContaining<Partial<UserDO>>({ outdatedSince: undefined }),
					expect.objectContaining<Partial<UserDO>>({ outdatedSince: undefined }),
					expect.objectContaining<Partial<UserDO>>({ outdatedSince: undefined }),
				]);
			});
		});

		describe('when the school has no migration', () => {
			const setup = () => {
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);
			};

			it('should throw an UnprocessableEntityException', async () => {
				setup();

				const func = async () => service.unmarkOutdatedUsers('schoolId');

				await expect(func).rejects.toThrow(UnprocessableEntityException);
			});
		});
	});

	describe('hasSchoolMigratedUser', () => {
		describe('when the school has no migration', () => {
			it('should return false', async () => {
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);

				const result = await service.hasSchoolMigratedUser('schoolId');

				expect(result).toBe(false);
			});
		});

		describe('when the school has migrated user', () => {
			const setup = () => {
				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build();

				return {
					userLoginMigration,
				};
			};

			it('should return true', async () => {
				const { userLoginMigration } = setup();
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);
				userService.findUsers.mockResolvedValue(new Page([userDoFactory.build()], 1));

				const result = await service.hasSchoolMigratedUser('schoolId');

				expect(result).toBe(true);
			});

			it('should call userLoginMigrationRepo.findBySchoolId', async () => {
				const { userLoginMigration } = setup();
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);

				await service.hasSchoolMigratedUser('schoolId');

				expect(userLoginMigrationRepo.findBySchoolId).toHaveBeenCalledWith('schoolId');
			});

			it('should call userService.findUsers', async () => {
				const { userLoginMigration } = setup();
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);

				await service.hasSchoolMigratedUser('schoolId');

				expect(userService.findUsers).toHaveBeenCalledWith({
					lastLoginSystemChangeBetweenStart: userLoginMigration.startedAt,
					lastLoginSystemChangeBetweenEnd: userLoginMigration.closedAt,
				});
			});
		});

		describe('when the school has no migrated user', () => {
			it('should return false', async () => {
				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build();
				userService.findUsers.mockResolvedValue(new Page([], 0));

				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);

				const result = await service.hasSchoolMigratedUser('schoolId');

				expect(result).toBe(false);
			});
		});
	});
});
