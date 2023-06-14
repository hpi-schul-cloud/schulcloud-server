import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { setupEntities } from '@shared/testing';
import { userLoginMigrationDOFactory } from '@shared/testing/factory/domainobject/user-login-migration.factory';
import { UserLoginMigrationService } from './user-login-migration.service';
import { UserLoginMigrationRollbackService } from './user-login-migration-rollback.service';
import { SchoolMigrationService } from './school-migration.service';
import { RollbackUserLoginMigrationError } from '../error/rollback-user-login-migration.error';
import { LegacyLogger } from '../../../core/logger';

describe('UserLoginMigrationRollbackService', () => {
	let module: TestingModule;
	let service: UserLoginMigrationRollbackService;

	let schoolMigrationService: DeepMocked<SchoolMigrationService>;
	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				UserLoginMigrationRollbackService,
				{
					provide: SchoolMigrationService,
					useValue: createMock<SchoolMigrationService>(),
				},
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		service = module.get(UserLoginMigrationRollbackService);
		schoolMigrationService = module.get(SchoolMigrationService);
		userLoginMigrationService = module.get(UserLoginMigrationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('rollbackIfNecessary', () => {
		describe('when schoolId is given', () => {
			it('should call schoolMigrationService.hasSchoolMigratedUser', async () => {
				const userLoginMigration = userLoginMigrationDOFactory.build({ schoolId: 'schoolId' });

				await service.rollbackIfNecessary(userLoginMigration.schoolId);

				expect(schoolMigrationService.hasSchoolMigratedUser).toHaveBeenCalledWith(userLoginMigration.schoolId);
			});
		});

		describe('when school has migrated user', () => {
			it('should not roll back migration', async () => {
				const userLoginMigration = userLoginMigrationDOFactory.build({ schoolId: 'schoolId' });
				schoolMigrationService.hasSchoolMigratedUser.mockResolvedValue(true);

				await service.rollbackIfNecessary(userLoginMigration.schoolId);

				expect(schoolMigrationService.rollbackMigration).not.toHaveBeenCalled();
				expect(userLoginMigrationService.deleteUserLoginMigration).not.toHaveBeenCalled();
			});
		});

		describe('when school has not migrated user', () => {
			describe('when userLoginMigration is not found', () => {
				const setup = () => {
					const userLoginMigration = userLoginMigrationDOFactory.build({ schoolId: 'schoolId' });
					schoolMigrationService.hasSchoolMigratedUser.mockResolvedValue(false);
					userLoginMigrationService.findMigrationBySchool.mockResolvedValue(null);

					return {
						userLoginMigration,
					};
				};

				it('should throw RollbackUserLoginMigrationError', async () => {
					const { userLoginMigration } = setup();

					const func = () => service.rollbackIfNecessary(userLoginMigration.schoolId);

					await expect(func()).rejects.toThrow(
						new RollbackUserLoginMigrationError(
							`The migration of school (${userLoginMigration.schoolId}) could not rolled back.`
						)
					);
				});
			});

			describe('when userLoginMigration is found', () => {
				const setup = () => {
					const userLoginMigration = userLoginMigrationDOFactory.build({ schoolId: 'schoolId' });
					schoolMigrationService.hasSchoolMigratedUser.mockResolvedValue(false);
					userLoginMigrationService.findMigrationBySchool.mockResolvedValue(userLoginMigration);

					return {
						userLoginMigration,
					};
				};

				it('should call userLoginMigrationService.findMigrationBySchool', async () => {
					const { userLoginMigration } = setup();

					await service.rollbackIfNecessary(userLoginMigration.schoolId);

					expect(userLoginMigrationService.findMigrationBySchool).toHaveBeenCalledWith(userLoginMigration.schoolId);
				});

				it('should call schoolMigrationService.rollbackMigration', async () => {
					const { userLoginMigration } = setup();

					await service.rollbackIfNecessary(userLoginMigration.schoolId);

					expect(schoolMigrationService.rollbackMigration).toHaveBeenCalledWith(
						userLoginMigration.schoolId,
						userLoginMigration.targetSystemId
					);
				});

				it('should call userLoginMigrationService.deleteUserLoginMigration', async () => {
					const { userLoginMigration } = setup();

					await service.rollbackIfNecessary(userLoginMigration.schoolId);

					expect(userLoginMigrationService.deleteUserLoginMigration).toHaveBeenCalledWith(userLoginMigration);
				});
			});
		});
	});
});
