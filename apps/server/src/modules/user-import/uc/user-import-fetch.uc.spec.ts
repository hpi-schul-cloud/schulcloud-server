import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationService } from '@modules/authorization';
import { System } from '@modules/system';
import { SystemEntity } from '@modules/system/entity';
import { Test, TestingModule } from '@nestjs/testing';
import { ImportUser, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { importUserFactory, setupEntities, systemEntityFactory, systemFactory, userFactory } from '@shared/testing';
import { IUserImportFeatures, UserImportFeatures } from '../config';
import { UserMigrationIsNotEnabledLoggableException } from '../loggable';
import { SchulconnexFetchImportUsersService, UserImportService } from '../service';
import { UserImportFetchUc } from './user-import-fetch.uc';

describe(UserImportFetchUc.name, () => {
	let module: TestingModule;
	let uc: UserImportFetchUc;

	let schulconnexFetchImportUsersService: DeepMocked<SchulconnexFetchImportUsersService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let userImportService: DeepMocked<UserImportService>;
	let userImportFeatures: IUserImportFeatures;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				UserImportFetchUc,
				{
					provide: UserImportFeatures,
					useValue: {},
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
		userImportFeatures = module.get(UserImportFeatures);
	});

	beforeEach(() => {
		Object.assign<IUserImportFeatures, IUserImportFeatures>(userImportFeatures, {
			userMigrationEnabled: true,
			userMigrationSystemId: new ObjectId().toHexString(),
			useWithUserLoginMigration: true,
		});
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
					userImportFeatures.userMigrationSystemId
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
			userImportFeatures.userMigrationEnabled = false;

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
			userImportFeatures.userMigrationSystemId = '';

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
