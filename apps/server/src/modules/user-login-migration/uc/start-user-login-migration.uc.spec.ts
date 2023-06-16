import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { SchoolDO, UserLoginMigrationDO } from '@shared/domain';
import { schoolDOFactory } from '@shared/testing';
import { UserLoginMigrationService, StartUserLoginMigrationValidationService } from '../service';
import { StartUserLoginMigrationError } from '../error';
import { StartUserLoginMigrationUc } from './start-user-login-migration.uc';

describe('StartUserLoginMigrationUc', () => {
	let module: TestingModule;
	let uc: StartUserLoginMigrationUc;

	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let startUserLoginMigrationValidationService: DeepMocked<StartUserLoginMigrationValidationService>;

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
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(StartUserLoginMigrationUc);
		userLoginMigrationService = module.get(UserLoginMigrationService);
		startUserLoginMigrationValidationService = module.get(StartUserLoginMigrationValidationService);
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

				startUserLoginMigrationValidationService.checkPreconditions.mockResolvedValue(Promise.resolve());
				userLoginMigrationService.startMigration.mockResolvedValue(migration);

				return { userId, migration, schoolId: school.id as string };
			};

			it('should check preconditions', async () => {
				const { userId, schoolId } = setup();

				await uc.startMigration(userId, schoolId);

				expect(startUserLoginMigrationValidationService.checkPreconditions).toHaveBeenCalledWith(userId, schoolId);
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
				const error: StartUserLoginMigrationError = new StartUserLoginMigrationError('');

				startUserLoginMigrationValidationService.checkPreconditions.mockRejectedValue(error);
				userLoginMigrationService.startMigration.mockResolvedValue(migration);

				return { userId, migration, schoolId: school.id as string };
			};

			it('should throw ForbiddenException ', async () => {
				const { userId, schoolId } = setup();

				await expect(uc.startMigration(userId, schoolId)).rejects.toThrow(new StartUserLoginMigrationError(''));
			});
		});
	});
});
