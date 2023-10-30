import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolFeatures } from '@shared/domain/entity/school.entity';
import { userLoginMigrationDOFactory } from '@shared/testing/factory/domainobject/user-login-migration-do.factory';
import { setupEntities } from '@shared/testing/setup-entities';
import { LegacySchoolService } from '@src/modules/legacy-school/service/legacy-school.service';
import { UserLoginMigrationRevertService } from './user-login-migration-revert.service';
import { UserLoginMigrationService } from './user-login-migration.service';

describe('UserLoginMigrationRevertService', () => {
	let module: TestingModule;
	let service: UserLoginMigrationRevertService;

	let schoolService: DeepMocked<LegacySchoolService>;
	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;

	beforeAll(async () => {
		await setupEntities();

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
					SchoolFeatures.OAUTH_PROVISIONING_ENABLED
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
