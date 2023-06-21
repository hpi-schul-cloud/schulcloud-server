import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { SchoolDO, UserLoginMigrationDO } from '@shared/domain';
import { schoolDOFactory } from '@shared/testing';
import { userLoginMigrationDOFactory } from '@shared/testing/factory/domainobject/user-login-migration-do.factory';
import { UserLoginMigrationService, RestartUserLoginMigrationValidationService } from '../service';
import { RestartUserLoginMigrationUc } from './restart-user-login-migration.uc';
import { UserLoginMigrationLoggableException } from '../error';

describe('RestartUserLoginMigrationUc', () => {
	let module: TestingModule;
	let uc: RestartUserLoginMigrationUc;

	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let restartUserLoginMigrationValidationService: DeepMocked<RestartUserLoginMigrationValidationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RestartUserLoginMigrationUc,
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
				{
					provide: RestartUserLoginMigrationValidationService,
					useValue: createMock<RestartUserLoginMigrationValidationService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(RestartUserLoginMigrationUc);
		userLoginMigrationService = module.get(UserLoginMigrationService);
		restartUserLoginMigrationValidationService = module.get(RestartUserLoginMigrationValidationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('restartMigration', () => {
		describe('when admin restarted migration successfully', () => {
			const setup = () => {
				const userId = 'userId';

				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
					closedAt: new Date(),
					finishedAt: new Date(),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId();

				restartUserLoginMigrationValidationService.checkPreconditions.mockResolvedValue(Promise.resolve());
				userLoginMigrationService.restartMigration.mockResolvedValue(migration);

				return { userId, migration, schoolId: school.id as string };
			};

			it('should check preconditions', async () => {
				const { userId, schoolId } = setup();

				await uc.restartMigration(userId, schoolId);

				expect(restartUserLoginMigrationValidationService.checkPreconditions).toHaveBeenCalledWith(userId, schoolId);
			});

			it('should restart the migration ', async () => {
				const { userId, schoolId } = setup();

				await uc.restartMigration(userId, schoolId);

				expect(userLoginMigrationService.restartMigration).toHaveBeenCalledWith(schoolId);
			});

			it('should return a UserLoginMigrationDO', async () => {
				const { userId, schoolId, migration } = setup();

				const result: UserLoginMigrationDO = await uc.restartMigration(userId, schoolId);

				expect(result).toEqual(migration);
			});
		});

		describe('when preconditions are not met', () => {
			const setup = () => {
				const userId = 'userId';

				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId();
				const error: UserLoginMigrationLoggableException = new UserLoginMigrationLoggableException('');

				restartUserLoginMigrationValidationService.checkPreconditions.mockRejectedValue(error);
				userLoginMigrationService.restartMigration.mockResolvedValue(migration);

				return { userId, migration, schoolId: school.id as string };
			};

			it('should throw ForbiddenException ', async () => {
				const { userId, schoolId } = setup();

				await expect(uc.restartMigration(userId, schoolId)).rejects.toThrow(
					new UserLoginMigrationLoggableException('')
				);
			});
		});
	});
});
