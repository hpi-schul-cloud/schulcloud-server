import { Test, TestingModule } from '@nestjs/testing';
import { SchoolDO, UserLoginMigrationDO } from '@shared/domain';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { schoolDOFactory } from '@shared/testing';
import { UserLoginMigrationService } from '../service';
import { LegacyLogger } from '../../../core/logger';
import { ToggleUserLoginMigrationUc } from './toggle-user-login-migration.uc';
import { CommonUserLoginMigrationService } from '../service/common-user-login-migration.service';

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
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
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

				const migration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId();

				commonUserLoginMigrationCheckService.ensurePermission.mockResolvedValue(Promise.resolve());
				commonUserLoginMigrationCheckService.findExistingUserLoginMigration.mockResolvedValue(migration);
				commonUserLoginMigrationCheckService.hasNotFinishedMigrationOrThrow.mockReturnThis();
				userLoginMigrationService.toggleMigration.mockResolvedValue(migration);

				return { userId, migration, schoolId: school.id as string };
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
