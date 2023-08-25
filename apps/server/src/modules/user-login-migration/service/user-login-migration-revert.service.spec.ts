import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolFeatures, UserLoginMigrationDO } from '@shared/domain';
import { SchoolService } from '@src/modules/school';
import { setupEntities, userLoginMigrationDOFactory } from '@shared/testing';
import { UserLoginMigrationRevertService } from './user-login-migration-revert.service';
import { UserLoginMigrationService } from './user-login-migration.service';

describe('UserLoginMigrationRevertService', () => {
	let module: TestingModule;
	let service: UserLoginMigrationRevertService;

	let schoolService: DeepMocked<SchoolService>;
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
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();

		service = module.get(UserLoginMigrationRevertService);
		schoolService = module.get(SchoolService);
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

			it('should return reverted user login migration', async () => {
				const { userLoginMigration } = setup();

				const result: UserLoginMigrationDO = await service.revertUserLoginMigration(userLoginMigration);

				expect(result).toEqual<UserLoginMigrationDO>({
					schoolId: userLoginMigration.schoolId,
					targetSystemId: userLoginMigration.targetSystemId,
					startedAt: undefined,
					finishedAt: undefined,
					mandatorySince: undefined,
					closedAt: undefined,
					sourceSystemId: undefined,
				});
			});
		});
	});
});
