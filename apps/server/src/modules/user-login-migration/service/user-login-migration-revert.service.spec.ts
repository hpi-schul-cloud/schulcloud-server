import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LegacySchoolService } from '@modules/legacy-school';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolFeature } from '@shared/domain/types';
import { userLoginMigrationDOFactory } from '@shared/testing';
import { UserLoginMigrationRevertService } from './user-login-migration-revert.service';
import { UserLoginMigrationService } from './user-login-migration.service';

describe('UserLoginMigrationRevertService', () => {
	let module: TestingModule;
	let service: UserLoginMigrationRevertService;

	let schoolService: DeepMocked<LegacySchoolService>;
	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserLoginMigrationRevertService,
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
			],
		}).compile();

		service = module.get(UserLoginMigrationRevertService);
		schoolService = module.get(LegacySchoolService);
		userLoginMigrationService = module.get(UserLoginMigrationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('revertUserLoginMigration', () => {
		describe('when userLoginMigration is given', () => {
			const setup = () => {
				const userLoginMigration = userLoginMigrationDOFactory.build({ schoolId: 'schoolId' });

				return {
					userLoginMigration,
				};
			};

			it('should call schoolService.removeFeature', async () => {
				const { userLoginMigration } = setup();

				await service.revertUserLoginMigration(userLoginMigration);

				expect(schoolService.removeFeature).toHaveBeenCalledWith(
					userLoginMigration.schoolId,
					SchoolFeature.OAUTH_PROVISIONING_ENABLED
				);
			});

			it('should call userLoginMigrationService.deleteUserLoginMigration', async () => {
				const { userLoginMigration } = setup();

				await service.revertUserLoginMigration(userLoginMigration);

				expect(userLoginMigrationService.deleteUserLoginMigration).toHaveBeenCalledWith(userLoginMigration);
			});
		});
	});
});
