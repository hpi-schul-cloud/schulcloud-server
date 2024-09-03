import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationService } from '@modules/authorization';
import { System, SystemService } from '@modules/system';
import { SystemEntity } from '@modules/system/entity';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UserLoginMigrationDO } from '@shared/domain/domainobject';
import { ImportUser, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import {
	importUserFactory,
	setupEntities,
	systemEntityFactory,
	systemFactory,
	userFactory,
	userLoginMigrationDOFactory,
} from '@shared/testing';
import { UserLoginMigrationService } from '../../user-login-migration';
import { UserLoginMigrationNotActiveLoggableException, UserMigrationIsNotEnabledLoggableException } from '../loggable';
import { SchulconnexFetchImportUsersService, UserImportService } from '../service';
import { UserImportConfig } from '../user-import-config';
import { UserImportFetchUc } from './user-import-fetch.uc';

describe(UserImportFetchUc.name, () => {
	let module: TestingModule;
	let uc: UserImportFetchUc;

	let configService: DeepMocked<ConfigService>;
	let schulconnexFetchImportUsersService: DeepMocked<SchulconnexFetchImportUsersService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let userImportService: DeepMocked<UserImportService>;
	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let systemService: DeepMocked<SystemService>;

	let config: UserImportConfig;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				UserImportFetchUc,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: SchulconnexFetchImportUsersService,
					useValue: createMock<SchulconnexFetchImportUsersService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: UserImportService,
					useValue: createMock<UserImportService>(),
				},
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
			],
		}).compile();

		uc = module.get(UserImportFetchUc);
		configService = module.get(ConfigService);
		schulconnexFetchImportUsersService = module.get(SchulconnexFetchImportUsersService);
		authorizationService = module.get(AuthorizationService);
		userImportService = module.get(UserImportService);
		userLoginMigrationService = module.get(UserLoginMigrationService);
		systemService = module.get(SystemService);
	});

	beforeEach(() => {
		config = {
			FEATURE_USER_MIGRATION_ENABLED: true,
			FEATURE_USER_MIGRATION_SYSTEM_ID: new ObjectId().toHexString(),
			FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION: true,
			IMPORTUSER_SAVE_ALL_MATCHES_REQUEST_TIMEOUT_MS: 0,
		};

		configService.get.mockImplementation((key: keyof UserImportConfig) => config[key]);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('fetchImportUsers', () => {
		describe('when fetching and matching users', () => {
			const setup = () => {
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId();
				const system: System = systemFactory.build({ id: systemEntity.id });
				const user: User = userFactory.buildWithId();
				const importUser: ImportUser = importUserFactory.build({
					system: systemEntity,
				});
				const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build({
					targetSystemId: system.id,
				});

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(userLoginMigration);
				systemService.findByIdOrFail.mockResolvedValueOnce(system);
				schulconnexFetchImportUsersService.getData.mockResolvedValueOnce([importUser]);
				schulconnexFetchImportUsersService.filterAlreadyMigratedUser.mockResolvedValueOnce([importUser]);
				userImportService.matchUsers.mockResolvedValueOnce([importUser]);

				return {
					user,
					systemEntity,
					system,
					importUser,
					userLoginMigration,
				};
			};

			it('should check the users permission', async () => {
				const { user } = setup();

				await uc.populateImportUsers(user.id);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.IMPORT_USER_MIGRATE]);
			});

			it('should filter migrated users', async () => {
				const { user, importUser, system } = setup();

				await uc.populateImportUsers(user.id);

				expect(schulconnexFetchImportUsersService.filterAlreadyMigratedUser).toHaveBeenCalledWith([importUser], system);
			});

			it('should match the users', async () => {
				const { user, importUser, userLoginMigration } = setup();

				await uc.populateImportUsers(user.id);

				expect(userImportService.matchUsers).toHaveBeenCalledWith([importUser], userLoginMigration);
			});

			it('should delete all existing imported users of the school', async () => {
				const { user } = setup();

				await uc.populateImportUsers(user.id);

				expect(userImportService.deleteImportUsersBySchool).toHaveBeenCalledWith(user.school);
			});

			it('should save the import users', async () => {
				const { user, importUser } = setup();

				await uc.populateImportUsers(user.id);

				expect(userImportService.saveImportUsers).toHaveBeenCalledWith([importUser]);
			});
		});
	});

	describe('when the school has not started the migration', () => {
		const setup = () => {
			const user: User = userFactory.buildWithId();

			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
			userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(null);

			return {
				user,
			};
		};

		it('should throw error', async () => {
			const { user } = setup();

			await expect(uc.populateImportUsers(user.id)).rejects.toThrow(UserLoginMigrationNotActiveLoggableException);
		});
	});

	describe('when the school has already closed the migration', () => {
		const setup = () => {
			const user: User = userFactory.buildWithId();
			const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.build({
				closedAt: new Date(),
			});

			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
			userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(userLoginMigration);

			return {
				user,
				userLoginMigration,
			};
		};

		it('should throw error', async () => {
			const { user } = setup();

			await expect(uc.populateImportUsers(user.id)).rejects.toThrow(UserLoginMigrationNotActiveLoggableException);
		});
	});

	describe('when the migration feature is not enabled', () => {
		const setup = () => {
			config.FEATURE_USER_MIGRATION_ENABLED = false;

			const user: User = userFactory.buildWithId();

			return {
				user,
			};
		};

		it('should throw an error', async () => {
			const { user } = setup();

			await expect(uc.populateImportUsers(user.id)).rejects.toThrow(UserMigrationIsNotEnabledLoggableException);
		});
	});
});
