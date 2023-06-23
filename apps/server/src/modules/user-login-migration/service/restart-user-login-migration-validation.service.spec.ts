import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolDO, UserLoginMigrationDO } from '@shared/domain';
import { schoolDOFactory, userDoFactory, userLoginMigrationDOFactory } from '@shared/testing';
import { RestartUserLoginMigrationValidationService } from './restart-user-login-migration-validation.service';
import { CommonUserLoginMigrationService } from './common-user-login-migration.service';
import { ModifyUserLoginMigrationLoggableException } from '../error';

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
				const user = userDoFactory.buildWithId();
				const userId = user.id ?? '';
				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2022-12-17T03:24:00'),
					closedAt: new Date('2023-12-17T03:24:00'),
					finishedAt: new Date('2055-12-17T03:24:00'),
				});
				const school: SchoolDO = schoolDOFactory.buildWithId({ id: migration.id });
				const schoolId = school.id ?? '';

				commonUserLoginMigrationService.ensurePermission.mockResolvedValue();
				commonUserLoginMigrationService.findExistingUserLoginMigration.mockResolvedValue(migration);

				return { userId, migration, schoolId };
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
				const user = userDoFactory.buildWithId();
				const userId = user.id ?? '';
				const school: SchoolDO = schoolDOFactory.buildWithId();
				const schoolId = school.id ?? '';

				commonUserLoginMigrationService.ensurePermission.mockResolvedValue();
				commonUserLoginMigrationService.findExistingUserLoginMigration.mockResolvedValue(null);

				return { userId, schoolId };
			};

			it('should throw StartUserLoginMigrationLoggableException ', async () => {
				const { userId, schoolId } = setup();

				const func = () => service.checkPreconditions(userId, schoolId);

				await expect(func()).rejects.toThrow(
					new ModifyUserLoginMigrationLoggableException(
						`Existing migration for school with id: ${schoolId} could not be found for restart.`,
						schoolId
					)
				);
			});
		});

		describe('when migration is not closed', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId({ id: 'userId' });
				const userId = user.id ?? '';
				const school: SchoolDO = schoolDOFactory.buildWithId();
				const schoolId = school.id ?? '';
				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId: school.id ?? '',
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2022-12-17T03:24:00'),
					closedAt: undefined,
					finishedAt: undefined,
				});

				commonUserLoginMigrationService.ensurePermission.mockResolvedValue();
				commonUserLoginMigrationService.findExistingUserLoginMigration.mockResolvedValue(migration);

				return { userId, schoolId };
			};

			it('should throw UserLoginMigrationLoggableException ', async () => {
				const { userId, schoolId } = setup();

				const func = () => service.checkPreconditions(userId, schoolId);

				await expect(func()).rejects.toThrow(
					new ModifyUserLoginMigrationLoggableException(
						`Migration for school with id ${schoolId ?? ''} is already started, you are not able to restart.`,
						schoolId
					)
				);
			});
		});

		describe('when grace period expired', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const userId = user.id ?? '';
				const school: SchoolDO = schoolDOFactory.buildWithId();
				const schoolId = school.id ?? '';
				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId: school.id ?? '',
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2022-12-17T03:24:00'),
					closedAt: new Date('2023-01-03T03:24:00'),
					finishedAt: new Date('2023-01-17T03:24:00'),
				});

				commonUserLoginMigrationService.ensurePermission.mockResolvedValue();
				commonUserLoginMigrationService.findExistingUserLoginMigration.mockResolvedValue(migration);

				return { userId, migration, schoolId };
			};

			it('should throw UserLoginMigrationLoggableException ', async () => {
				const { userId, schoolId, migration } = setup();

				const func = () => service.checkPreconditions(userId, schoolId);

				await expect(func()).rejects.toThrow(
					new ModifyUserLoginMigrationLoggableException(
						'grace_period_expired: The grace period after finishing migration has expired',
						schoolId,
						migration.finishedAt
					)
				);
			});
		});
	});
});
