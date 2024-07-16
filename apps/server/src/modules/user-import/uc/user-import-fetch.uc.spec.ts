import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationService } from '@modules/authorization';
import { ConfigService } from '@nestjs/config';
import { System } from '@modules/system';
import { SystemEntity } from '@modules/system/entity';
import { Test, TestingModule } from '@nestjs/testing';
import { ImportUser, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { importUserFactory, setupEntities, systemEntityFactory, systemFactory, userFactory } from '@shared/testing';
import { UserMigrationIsNotEnabledLoggableException } from '../loggable';
import { SchulconnexFetchImportUsersService, UserImportService } from '../service';
import { UserImportConfig } from '../user-import-config';
import { UserImportFetchUc } from './user-import-fetch.uc';

describe(UserImportFetchUc.name, () => {
	let module: TestingModule;
	let uc: UserImportFetchUc;

	let schulconnexFetchImportUsersService: DeepMocked<SchulconnexFetchImportUsersService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let userImportService: DeepMocked<UserImportService>;

	const config: UserImportConfig = {
		FEATURE_USER_MIGRATION_ENABLED: true,
		FEATURE_USER_MIGRATION_SYSTEM_ID: new ObjectId().toHexString(),
		FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION: true,
		IMPORTUSER_SAVE_ALL_MATCHES_REQUEST_TIMEOUT_MS: 0,
	};

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				UserImportFetchUc,
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn().mockImplementation((key: keyof UserImportConfig) => config[key]),
					},
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
			],
		}).compile();

		uc = module.get(UserImportFetchUc);
		schulconnexFetchImportUsersService = module.get(SchulconnexFetchImportUsersService);
		authorizationService = module.get(AuthorizationService);
		userImportService = module.get(UserImportService);
	});

	beforeEach(() => {
		config.FEATURE_USER_MIGRATION_ENABLED = true;
		config.FEATURE_USER_MIGRATION_SYSTEM_ID = new ObjectId().toHexString();
		config.FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION = true;
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
				const system: SystemEntity = systemEntityFactory.buildWithId(
					undefined,
					config.FEATURE_USER_MIGRATION_SYSTEM_ID
				);
				const systemDo: System = systemFactory.build({ id: system.id });
				const user: User = userFactory.buildWithId();
				const importUser: ImportUser = importUserFactory.build({
					system,
				});

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				userImportService.getMigrationSystem.mockResolvedValueOnce(systemDo);
				schulconnexFetchImportUsersService.getData.mockResolvedValueOnce([importUser]);
				schulconnexFetchImportUsersService.filterAlreadyMigratedUser.mockResolvedValueOnce([importUser]);
				userImportService.matchUsers.mockResolvedValueOnce([importUser]);

				return {
					user,
					system,
					importUser,
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

				expect(schulconnexFetchImportUsersService.filterAlreadyMigratedUser).toHaveBeenCalledWith(
					[importUser],
					system.id
				);
			});

			it('should match the users', async () => {
				const { user, importUser } = setup();

				await uc.populateImportUsers(user.id);

				expect(userImportService.matchUsers).toHaveBeenCalledWith([importUser]);
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

	describe('when the target system id is not defined', () => {
		const setup = () => {
			config.FEATURE_USER_MIGRATION_SYSTEM_ID = '';

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
