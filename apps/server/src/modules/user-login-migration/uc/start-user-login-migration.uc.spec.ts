import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LegacyLogger } from '@src/core/logger';
import { SchoolDO, UserLoginMigrationDO } from '@shared/domain';
import { schoolDOFactory } from '@shared/testing';
import { UserLoginMigrationService } from '../service';
import { ModifyUserLoginMigrationError } from '../error';
import { StartUserLoginMigrationUc } from './start-user-login-migration.uc';
import { StartUserLoginMigrationValidationService } from '../service/start-user-login-migration-validation.service';

describe('StartUserLoginMigrationUc', () => {
	let module: TestingModule;
	let uc: StartUserLoginMigrationUc;

	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let startUserLoginMigrationCheckService: DeepMocked<StartUserLoginMigrationValidationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				StartUserLoginMigrationUc,
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
				{
					provide: StartUserLoginMigrationValidationService,
					useValue: createMock<StartUserLoginMigrationValidationService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		uc = module.get(StartUserLoginMigrationUc);
		userLoginMigrationService = module.get(UserLoginMigrationService);
		startUserLoginMigrationCheckService = module.get(StartUserLoginMigrationValidationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('startMigration', () => {
		describe('when admin started migration successfully', () => {
			const setup = () => {
				const userId = 'userId';

				const migration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId();

				startUserLoginMigrationCheckService.checkPreconditions.mockResolvedValue(Promise.resolve());
				userLoginMigrationService.startMigration.mockResolvedValue(migration);

				return { userId, migration, schoolId: school.id as string };
			};

			it('should check preconditions', async () => {
				const { userId, schoolId } = setup();

				await uc.startMigration(userId, schoolId);

				expect(startUserLoginMigrationCheckService.checkPreconditions).toHaveBeenCalledWith(userId, schoolId);
			});

			it('should start the migration ', async () => {
				const { userId, schoolId } = setup();

				await uc.startMigration(userId, schoolId);

				expect(userLoginMigrationService.startMigration).toHaveBeenCalledWith(schoolId);
			});

			it('should return a UserLoginMigrationDO', async () => {
				const { userId, schoolId, migration } = setup();

				const result: UserLoginMigrationDO = await uc.startMigration(userId, schoolId);

				expect(result).toEqual(migration);
			});
		});

		describe('when preconditions are not met', () => {
			const setup = () => {
				const userId = 'userId';

				const migration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId();
				const error: ModifyUserLoginMigrationError = new ModifyUserLoginMigrationError('');

				startUserLoginMigrationCheckService.checkPreconditions.mockRejectedValue(error);
				userLoginMigrationService.startMigration.mockResolvedValue(migration);

				return { userId, migration, schoolId: school.id as string };
			};

			it('should throw ForbiddenException ', async () => {
				const { userId, schoolId } = setup();

				await expect(uc.startMigration(userId, schoolId)).rejects.toThrow(new ModifyUserLoginMigrationError(''));
			});
		});
	});
});
