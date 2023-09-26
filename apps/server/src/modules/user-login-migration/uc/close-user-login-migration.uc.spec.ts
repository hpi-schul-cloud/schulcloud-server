import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, UserLoginMigrationDO } from '@shared/domain';
import { setupEntities, userFactory, userLoginMigrationDOFactory } from '@shared/testing';
import { Action, AuthorizationService } from '@src/modules/authorization';
import { UserLoginMigrationNotFoundLoggableException } from '../error';
import { SchoolMigrationService, UserLoginMigrationRevertService, UserLoginMigrationService } from '../service';
import { CloseUserLoginMigrationUc } from './close-user-login-migration.uc';

describe('CloseUserLoginMigrationUc', () => {
	let module: TestingModule;
	let uc: CloseUserLoginMigrationUc;

	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let schoolMigrationService: DeepMocked<SchoolMigrationService>;
	let userLoginMigrationRevertService: DeepMocked<UserLoginMigrationRevertService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				CloseUserLoginMigrationUc,
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
				{
					provide: SchoolMigrationService,
					useValue: createMock<SchoolMigrationService>(),
				},
				{
					provide: UserLoginMigrationRevertService,
					useValue: createMock<UserLoginMigrationRevertService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		uc = module.get(CloseUserLoginMigrationUc);
		userLoginMigrationService = module.get(UserLoginMigrationService);
		schoolMigrationService = module.get(SchoolMigrationService);
		userLoginMigrationRevertService = module.get(UserLoginMigrationRevertService);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('closeMigration', () => {
		describe('when the user login migration was closed after a migration', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId();
				const closedUserLoginMigration = new UserLoginMigrationDO({
					...userLoginMigration,
					closedAt: new Date(2023, 1),
				});
				const schoolId = 'schoolId';

				userLoginMigrationService.findMigrationBySchool.mockResolvedValue(userLoginMigration);
				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				userLoginMigrationService.closeMigration.mockResolvedValue(closedUserLoginMigration);
				schoolMigrationService.hasSchoolMigratedUser.mockResolvedValue(true);

				return {
					user,
					schoolId,
					userLoginMigration,
					closedUserLoginMigration,
				};
			};

			it('should check the permission', async () => {
				const { user, schoolId, userLoginMigration } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, userLoginMigration, {
					requiredPermissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
					action: Action.write,
				});
			});

			it('should close the migration', async () => {
				const { user, schoolId } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(userLoginMigrationService.closeMigration).toHaveBeenCalledWith(schoolId);
			});

			it('should mark all un-migrated users as outdated', async () => {
				const { user, schoolId } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(schoolMigrationService.markUnmigratedUsersAsOutdated).toHaveBeenCalledWith(schoolId);
			});

			it('should return the closed user login migration', async () => {
				const { user, schoolId, closedUserLoginMigration } = setup();

				const result = await uc.closeMigration(user.id, schoolId);

				expect(result).toEqual(closedUserLoginMigration);
			});
		});

		describe('when no user login migration exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const schoolId = 'schoolId';

				userLoginMigrationService.findMigrationBySchool.mockResolvedValue(null);

				return {
					user,
					schoolId,
				};
			};

			it('should throw a not found exception', async () => {
				const { user, schoolId } = setup();

				const func = () => uc.closeMigration(user.id, schoolId);

				await expect(func).rejects.toThrow(UserLoginMigrationNotFoundLoggableException);
			});
		});

		describe('when the user login migration was closed without any migration', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId();
				const closedUserLoginMigration = new UserLoginMigrationDO({
					...userLoginMigration,
					closedAt: new Date(2023, 1),
				});
				const schoolId = 'schoolId';

				userLoginMigrationService.findMigrationBySchool.mockResolvedValue(userLoginMigration);
				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				userLoginMigrationService.closeMigration.mockResolvedValue(closedUserLoginMigration);
				schoolMigrationService.hasSchoolMigratedUser.mockResolvedValue(false);

				return {
					user,
					schoolId,
					userLoginMigration,
					closedUserLoginMigration,
				};
			};

			it('should check the permission', async () => {
				const { user, schoolId, userLoginMigration } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, userLoginMigration, {
					requiredPermissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
					action: Action.write,
				});
			});

			it('should revert the start of the migration', async () => {
				const { user, schoolId, closedUserLoginMigration } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(userLoginMigrationRevertService.revertUserLoginMigration).toHaveBeenCalledWith(closedUserLoginMigration);
			});

			it('should not mark all un-migrated users as outdated', async () => {
				const { user, schoolId } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(schoolMigrationService.markUnmigratedUsersAsOutdated).not.toHaveBeenCalled();
			});

			it('should return  undefined', async () => {
				const { user, schoolId } = setup();

				const result = await uc.closeMigration(user.id, schoolId);

				expect(result).toBeUndefined();
			});
		});

		describe('when the user login migration was already closed', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					closedAt: new Date(2023, 1),
				});
				const schoolId = 'schoolId';

				userLoginMigrationService.findMigrationBySchool.mockResolvedValue(userLoginMigration);
				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				schoolMigrationService.hasSchoolMigratedUser.mockResolvedValue(false);

				return {
					user,
					schoolId,
					userLoginMigration,
				};
			};

			it('should not modify the user login migration', async () => {
				const { user, schoolId } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(userLoginMigrationService.closeMigration).not.toHaveBeenCalled();
			});

			it('should return the already closed user login migration', async () => {
				const { user, schoolId, userLoginMigration } = setup();

				const result = await uc.closeMigration(user.id, schoolId);

				expect(result).toEqual(userLoginMigration);
			});
		});
	});
});
