import { Test, TestingModule } from '@nestjs/testing';
import { SchoolDO, UserLoginMigrationDO } from '@shared/domain';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { schoolDOFactory, userLoginMigrationDOFactory } from '@shared/testing';
import { UserLoginMigrationService, CommonUserLoginMigrationService } from '../service';
import { Logger } from '@src/core/logger';
import { ToggleUserLoginMigrationUc } from './toggle-user-login-migration.uc';

describe('ToggleUserLoginMigrationUc', () => {
	let module: TestingModule;
	let uc: ToggleUserLoginMigrationUc;

	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let commonUserLoginMigrationCheckService: DeepMocked<CommonUserLoginMigrationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToggleUserLoginMigrationUc,
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
				{
					provide: CommonUserLoginMigrationService,
					useValue: createMock<CommonUserLoginMigrationService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(ToggleUserLoginMigrationUc);
		userLoginMigrationService = module.get(UserLoginMigrationService);
		commonUserLoginMigrationCheckService = module.get(CommonUserLoginMigrationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('toggleMigration', () => {
		describe('when admin modified migration successfully', () => {
			const setup = () => {
				const userId = 'userId';

				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId();
				const schoolId = school.id ?? '';

				commonUserLoginMigrationCheckService.ensurePermission.mockResolvedValue(Promise.resolve());
				commonUserLoginMigrationCheckService.findExistingUserLoginMigration.mockResolvedValue(migration);
				commonUserLoginMigrationCheckService.hasNotFinishedMigrationOrThrow.mockReturnThis();
				userLoginMigrationService.toggleMigration.mockResolvedValue(migration);

				return { userId, migration, schoolId };
			};

			it('should check preconditions', async () => {
				const { userId, schoolId, migration } = setup();

				await uc.toggleMigration(userId, schoolId);

				expect(commonUserLoginMigrationCheckService.ensurePermission).toHaveBeenCalledWith(userId, schoolId);
				expect(commonUserLoginMigrationCheckService.findExistingUserLoginMigration).toHaveBeenCalledWith(schoolId);
				expect(commonUserLoginMigrationCheckService.hasNotFinishedMigrationOrThrow).toHaveBeenCalledWith(migration);
			});
		});
	});
});
