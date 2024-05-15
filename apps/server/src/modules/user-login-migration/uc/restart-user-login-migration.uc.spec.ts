import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserLoginMigrationDO } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { setupEntities, userFactory, userLoginMigrationDOFactory } from '@shared/testing/factory';
import { Logger } from '@src/core/logger';
import { UserLoginMigrationNotFoundLoggableException } from '../loggable';
import { SchoolMigrationService, UserLoginMigrationService } from '../service';
import { RestartUserLoginMigrationUc } from './restart-user-login-migration.uc';

describe(RestartUserLoginMigrationUc.name, () => {
	let module: TestingModule;
	let uc: RestartUserLoginMigrationUc;

	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolMigrationService: DeepMocked<SchoolMigrationService>;

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
					provide: SchoolMigrationService,
					useValue: createMock<SchoolMigrationService>(),
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
		schoolMigrationService = module.get(SchoolMigrationService);

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
				const migrationAfterRestart: UserLoginMigrationDO = new UserLoginMigrationDO({
					...migrationBeforeRestart,
					closedAt: undefined,
				});

				const user: User = userFactory.buildWithId();

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(migrationBeforeRestart);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				userLoginMigrationService.restartMigration.mockResolvedValueOnce(migrationAfterRestart);

				return {
					user,
					migrationBeforeRestart,
					migrationAfterRestart,
				};
			};

			it('should check permission', async () => {
				const { user, migrationBeforeRestart } = setup();

				await uc.restartMigration(user.id, user.school.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					migrationBeforeRestart,
					AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN])
				);
			});

			it('should restart the migration', async () => {
				const { user, migrationBeforeRestart } = setup();

				await uc.restartMigration(user.id, user.school.id);

				expect(userLoginMigrationService.restartMigration).toHaveBeenCalledWith(migrationBeforeRestart);
			});

			it('should unmark outdated users', async () => {
				const { user, migrationAfterRestart } = setup();

				await uc.restartMigration(user.id, user.school.id);

				expect(schoolMigrationService.unmarkOutdatedUsers).toHaveBeenCalledWith(migrationAfterRestart);
			});

			it('should return a UserLoginMigration', async () => {
				const { user, migrationAfterRestart } = setup();

				const result: UserLoginMigrationDO = await uc.restartMigration(user.id, user.school.id);

				expect(result).toEqual(migrationAfterRestart);
			});
		});

		describe('when the user does not have enough permission', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const migrationBeforeRestart: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					closedAt: new Date(2023, 5),
				});

				const error = new ForbiddenException();

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(migrationBeforeRestart);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw error;
				});

				return {
					user,
					error,
				};
			};

			it('should throw an exception', async () => {
				const { user, error } = setup();

				await expect(uc.restartMigration(user.id, user.school.id)).rejects.toThrow(error);
			});
		});

		describe('when there is no migration yet', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(null);

				return {
					user,
				};
			};

			it('should throw a UserLoginMigrationNotFoundLoggableException', async () => {
				const { user } = setup();

				await expect(uc.restartMigration(user.id, user.school.id)).rejects.toThrow(
					UserLoginMigrationNotFoundLoggableException
				);
			});
		});
	});
});
