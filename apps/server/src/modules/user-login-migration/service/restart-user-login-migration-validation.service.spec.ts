import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolDO, UserLoginMigrationDO } from '@shared/domain';
import { schoolDOFactory } from '@shared/testing';
import { RestartUserLoginMigrationError } from '../error';
import { RestartUserLoginMigrationValidationService } from './restart-user-login-migration-validation.service';
import { CommonUserLoginMigrationService } from './common-user-login-migration.service';

describe('RestartUserLoginMigrationValidationService', () => {
	let module: TestingModule;
	let service: RestartUserLoginMigrationValidationService;

	let commonUserLoginMigrationService: DeepMocked<CommonUserLoginMigrationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RestartUserLoginMigrationValidationService,
				{
					provide: CommonUserLoginMigrationService,
					useValue: createMock<CommonUserLoginMigrationService>(),
				},
			],
		}).compile();

		service = module.get(RestartUserLoginMigrationValidationService);
		commonUserLoginMigrationService = module.get(CommonUserLoginMigrationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('checkPreconditions', () => {
		describe('when preconditions are met', () => {
			const setup = () => {
				const userId = 'userId';

				const migration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2022-12-17T03:24:00'),
					closedAt: new Date('2023-12-17T03:24:00'),
					finishedAt: new Date('2055-12-17T03:24:00'),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId({ id: migration.id });

				commonUserLoginMigrationService.ensurePermission.mockResolvedValue(Promise.resolve());
				commonUserLoginMigrationService.findExistingUserLoginMigration.mockResolvedValue(migration);

				return { userId, migration, schoolId: school.id as string };
			};

			it('should call ensurePermission', async () => {
				const { userId, schoolId } = setup();

				await service.checkPreconditions(userId, schoolId);

				expect(commonUserLoginMigrationService.ensurePermission).toHaveBeenCalledWith(userId, schoolId);
			});

			it('should check if migration exists', async () => {
				const { userId, schoolId } = setup();

				await service.checkPreconditions(userId, schoolId);

				expect(commonUserLoginMigrationService.findExistingUserLoginMigration).toHaveBeenCalledWith(schoolId);
			});
		});

		describe('when migration could not be found', () => {
			const setup = () => {
				const userId = 'userId';

				const school: SchoolDO = schoolDOFactory.buildWithId();

				commonUserLoginMigrationService.ensurePermission.mockResolvedValue(Promise.resolve());
				commonUserLoginMigrationService.findExistingUserLoginMigration.mockResolvedValue(null);

				return { userId, schoolId: school.id as string };
			};

			it('should throw RestartUserLoginMigrationError ', async () => {
				const { userId, schoolId } = setup();

				await expect(service.checkPreconditions(userId, schoolId)).rejects.toThrow(
					new RestartUserLoginMigrationError(
						`Existing migration for school with id: ${schoolId} could not be found for restart.`
					)
				);
			});
		});

		describe('when migration is not closed', () => {
			const setup = () => {
				const userId = 'userId';
				const school: SchoolDO = schoolDOFactory.buildWithId();
				const migration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: school.id ?? '',
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2022-12-17T03:24:00'),
				});

				commonUserLoginMigrationService.ensurePermission.mockResolvedValue(Promise.resolve());
				commonUserLoginMigrationService.findExistingUserLoginMigration.mockResolvedValue(migration);

				return { userId, migration, schoolId: school.id as string };
			};

			it('should throw RestartUserLoginMigrationError ', async () => {
				const { userId, schoolId } = setup();

				await expect(service.checkPreconditions(userId, schoolId)).rejects.toThrow(
					new RestartUserLoginMigrationError(
						`Migration for school with id ${schoolId} is already started, you are not able to restart.`
					)
				);
			});
		});

		describe('when grace period expired', () => {
			const setup = () => {
				const userId = 'userId';
				const school: SchoolDO = schoolDOFactory.buildWithId();
				const migration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: school.id ?? '',
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2022-12-17T03:24:00'),
					closedAt: new Date('2023-01-03T03:24:00'),
					finishedAt: new Date('2023-01-17T03:24:00'),
				});

				commonUserLoginMigrationService.ensurePermission.mockResolvedValue(Promise.resolve());
				commonUserLoginMigrationService.findExistingUserLoginMigration.mockResolvedValue(migration);

				return { userId, migration, schoolId: school.id as string };
			};

			it('should throw RestartUserLoginMigrationError ', async () => {
				const { userId, schoolId, migration } = setup();

				await expect(service.checkPreconditions(userId, schoolId)).rejects.toThrow(
					new RestartUserLoginMigrationError(
						'grace_period_expired: The grace period after finishing migration has expired',
						{
							finishedAt: migration.finishedAt,
						}
					)
				);
			});
		});
	});
});
