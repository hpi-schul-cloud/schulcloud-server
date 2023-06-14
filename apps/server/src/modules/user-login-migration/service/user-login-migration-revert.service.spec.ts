import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { setupEntities } from '@shared/testing';
import { userLoginMigrationDOFactory } from '@shared/testing/factory/domainobject/user-login-migration.factory';
import { UserLoginMigrationDO } from '@shared/domain';
import { UserLoginMigrationService } from './user-login-migration.service';
import { UserLoginMigrationRevertService } from './user-login-migration-revert.service';
import { SchoolMigrationService } from './school-migration.service';

describe('UserLoginMigrationRevertService', () => {
	let module: TestingModule;
	let service: UserLoginMigrationRevertService;

	let schoolMigrationService: DeepMocked<SchoolMigrationService>;
	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				UserLoginMigrationRevertService,
				{
					provide: SchoolMigrationService,
					useValue: createMock<SchoolMigrationService>(),
				},
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
			],
		}).compile();

		service = module.get(UserLoginMigrationRevertService);
		schoolMigrationService = module.get(SchoolMigrationService);
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

			it('should call schoolMigrationService.rollbackMigration', async () => {
				const { userLoginMigration } = setup();

				await service.revertUserLoginMigration(userLoginMigration);

				expect(schoolMigrationService.revertMigration).toHaveBeenCalledWith(
					userLoginMigration.schoolId,
					userLoginMigration.targetSystemId
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
