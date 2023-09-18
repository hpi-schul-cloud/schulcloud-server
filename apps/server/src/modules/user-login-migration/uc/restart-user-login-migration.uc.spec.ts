import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, LegacySchoolDo, User, UserLoginMigrationDO } from '@shared/domain';
import { legacySchoolDoFactory, setupEntities, userFactory, userLoginMigrationDOFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { LegacySchoolService } from '@src/modules/legacy-school';
import {
	UserLoginMigrationGracePeriodExpiredLoggableException,
	UserLoginMigrationNotFoundLoggableException,
} from '../error';
import { UserLoginMigrationService } from '../service';
import { RestartUserLoginMigrationUc } from './restart-user-login-migration.uc';

describe('RestartUserLoginMigrationUc', () => {
	let module: TestingModule;
	let uc: RestartUserLoginMigrationUc;

	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolService: DeepMocked<LegacySchoolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RestartUserLoginMigrationUc,
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(RestartUserLoginMigrationUc);
		userLoginMigrationService = module.get(UserLoginMigrationService);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(LegacySchoolService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('restartMigration', () => {
		describe('when an admin restarts a closed migration', () => {
			const setup = () => {
				const migrationBeforeRestart: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					closedAt: new Date(2023, 5),
				});
				const migrationAfterRestart: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId();

				const user: User = userFactory.buildWithId();

				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(migrationBeforeRestart);
				userLoginMigrationService.restartMigration.mockResolvedValueOnce(migrationAfterRestart);

				return { user, school, migrationAfterRestart };
			};

			it('should check permission', async () => {
				const { user, school } = setup();

				await uc.restartMigration('userId', 'schoolId');

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					school,
					AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN])
				);
			});

			it('should call the service to restart a migration', async () => {
				setup();

				await uc.restartMigration('userId', 'schoolId');

				expect(userLoginMigrationService.restartMigration).toHaveBeenCalledWith('schoolId');
			});

			it('should return a UserLoginMigration', async () => {
				const { migrationAfterRestart } = setup();

				const result: UserLoginMigrationDO = await uc.restartMigration('userId', 'schoolId');

				expect(result).toEqual(migrationAfterRestart);
			});
		});

		describe('when an admin restarts a running migration', () => {
			const setup = () => {
				const runningMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId();

				const user: User = userFactory.buildWithId();

				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(runningMigration);

				return { user, school, runningMigration };
			};

			it('should check permission', async () => {
				const { user, school } = setup();

				await uc.restartMigration('userId', 'schoolId');

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					school,
					AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN])
				);
			});

			it('should not call the service to restart a migration', async () => {
				setup();

				await uc.restartMigration('userId', 'schoolId');

				expect(userLoginMigrationService.restartMigration).not.toHaveBeenCalled();
			});

			it('should return a UserLoginMigration', async () => {
				const { runningMigration } = setup();

				const result: UserLoginMigrationDO = await uc.restartMigration('userId', 'schoolId');

				expect(result).toEqual(runningMigration);
			});
		});

		describe('when the user does not have enough permission', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();

				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});
			};

			it('should throw an exception', async () => {
				setup();

				const func = async () => uc.restartMigration('userId', 'schoolId');

				await expect(func).rejects.toThrow(ForbiddenException);
			});
		});

		describe('when there is no migration yet', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();

				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(null);
			};

			it('should throw a UserLoginMigrationNotFoundLoggableException', async () => {
				setup();

				const func = async () => uc.restartMigration('userId', 'schoolId');

				await expect(func).rejects.toThrow(UserLoginMigrationNotFoundLoggableException);
			});
		});

		describe('when the grace period for restarting a migration has expired', () => {
			const setup = () => {
				jest.useFakeTimers();
				jest.setSystemTime(new Date(2023, 6));

				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					closedAt: new Date(2023, 5),
					finishedAt: new Date(2023, 5),
				});

				const user: User = userFactory.buildWithId();

				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(migration);
			};

			it('should throw a UserLoginMigrationGracePeriodExpiredLoggableException', async () => {
				setup();

				const func = async () => uc.restartMigration('userId', 'schoolId');

				await expect(func).rejects.toThrow(UserLoginMigrationGracePeriodExpiredLoggableException);
			});
		});
	});
});
