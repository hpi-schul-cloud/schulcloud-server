import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthenticationService } from '@modules/authentication/services/authentication.service';
import { Action, AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { OAuthTokenDto } from '@modules/oauth';
import { OAuthService } from '@modules/oauth/service/oauth.service';
import { ProvisioningService } from '@modules/provisioning';
import { ExternalSchoolDto, ExternalUserDto, OauthDataDto, ProvisioningSystemDto } from '@modules/provisioning/dto';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { LegacySchoolDo, Page, Permission, SystemEntity, User, UserLoginMigrationDO } from '@shared/domain';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import {
	legacySchoolDoFactory,
	setupEntities,
	systemFactory,
	userFactory,
	userLoginMigrationDOFactory,
} from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { ExternalSchoolNumberMissingLoggableException } from '../loggable';
import { SchoolMigrationService, UserLoginMigrationService, UserMigrationService } from '../service';
import { UserLoginMigrationUc } from './user-login-migration.uc';

describe(UserLoginMigrationUc.name, () => {
	let module: TestingModule;
	let uc: UserLoginMigrationUc;

	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let oAuthService: DeepMocked<OAuthService>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let schoolMigrationService: DeepMocked<SchoolMigrationService>;
	let userMigrationService: DeepMocked<UserMigrationService>;
	let authenticationService: DeepMocked<AuthenticationService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				UserLoginMigrationUc,
				{
					provide: UserMigrationService,
					useValue: createMock<UserMigrationService>(),
				},
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
				{
					provide: OAuthService,
					useValue: createMock<OAuthService>(),
				},
				{
					provide: ProvisioningService,
					useValue: createMock<ProvisioningService>(),
				},
				{
					provide: SchoolMigrationService,
					useValue: createMock<SchoolMigrationService>(),
				},
				{
					provide: AuthenticationService,
					useValue: createMock<AuthenticationService>(),
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
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		uc = module.get(UserLoginMigrationUc);
		userMigrationService = module.get(UserMigrationService);
		userLoginMigrationService = module.get(UserLoginMigrationService);
		oAuthService = module.get(OAuthService);
		provisioningService = module.get(ProvisioningService);
		schoolMigrationService = module.get(SchoolMigrationService);
		userMigrationService = module.get(UserMigrationService);
		authenticationService = module.get(AuthenticationService);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getMigrations', () => {
		describe('when searching for a users migration', () => {
			const setup = () => {
				const userId = 'userId';

				const migrations: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				userLoginMigrationService.findMigrationByUser.mockResolvedValueOnce(migrations);

				return { userId, migrations };
			};

			it('should return a response', async () => {
				const { userId, migrations } = setup();

				const result: Page<UserLoginMigrationDO> = await uc.getMigrations(userId, { userId });

				expect(result).toEqual<Page<UserLoginMigrationDO>>({
					data: [migrations],
					total: 1,
				});
			});
		});

		describe('when a user has no migration available', () => {
			const setup = () => {
				const userId = 'userId';

				userLoginMigrationService.findMigrationByUser.mockResolvedValueOnce(null);

				return { userId };
			};

			it('should return a response', async () => {
				const { userId } = setup();

				const result: Page<UserLoginMigrationDO> = await uc.getMigrations(userId, { userId });

				expect(result).toEqual<Page<UserLoginMigrationDO>>({
					data: [],
					total: 0,
				});
			});
		});

		describe('when searching for other users migrations', () => {
			const setup = () => {
				const userId = 'userId';

				return { userId };
			};

			it('should return a response', async () => {
				const { userId } = setup();

				const func = async () => uc.getMigrations(userId, { userId: 'otherUserId' });

				await expect(func).rejects.toThrow(
					new ForbiddenException('Accessing migration status of another user is forbidden.')
				);
			});
		});
	});

	describe('findUserLoginMigrationBySchool', () => {
		describe('when searching for an existing user login migration', () => {
			const setup = () => {
				const schoolId = 'schoolId';

				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId,
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});
				const user: User = userFactory.buildWithId();

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(migration);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return { user, schoolId, migration };
			};

			it('should should check the users permission', async () => {
				const { user, migration, schoolId } = setup();

				await uc.findUserLoginMigrationBySchool(user.id, schoolId);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, migration, {
					requiredPermissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
					action: Action.read,
				});
			});

			it('should return the user login migration', async () => {
				const { user, migration, schoolId } = setup();

				const result: UserLoginMigrationDO = await uc.findUserLoginMigrationBySchool(user.id, schoolId);

				expect(result).toEqual(migration);
			});
		});

		describe('when a user login migration does not exist', () => {
			const setup = () => {
				const schoolId = 'schoolId';

				const user: User = userFactory.buildWithId();

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(null);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return { user, schoolId };
			};

			it('should return throw not found exception', async () => {
				const { user, schoolId } = setup();

				const func = () => uc.findUserLoginMigrationBySchool(user.id, schoolId);

				await expect(func).rejects.toThrow(NotFoundLoggableException);
			});
		});

		describe('when the authorization fails', () => {
			const setup = () => {
				const schoolId = 'schoolId';

				const user: User = userFactory.buildWithId();

				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId,
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				const error = new Error('Authorization failed');

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(migration);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkPermission.mockImplementation(() => {
					throw error;
				});

				return { user, schoolId, error };
			};

			it('should throw an error', async () => {
				const { user, schoolId, error } = setup();

				const func = () => uc.findUserLoginMigrationBySchool(user.id, schoolId);

				await expect(func).rejects.toThrow(error);
			});
		});
	});

	describe('migrate', () => {
		describe('when user migrates from one to another system', () => {
			const setup = () => {
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
					}),
					externalUser: new ExternalUserDto({
						externalId: 'externalUserId',
					}),
				});

				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				oAuthService.authenticateUser.mockResolvedValueOnce(tokenDto);
				provisioningService.getData.mockResolvedValueOnce(oauthData);

				return {
					oauthData,
					tokenDto,
				};
			};

			it('should authenticate the user with oauth2', async () => {
				setup();

				await uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri');

				expect(oAuthService.authenticateUser).toHaveBeenCalledWith('systemId', 'redirectUri', 'code');
			});

			it('should fetch the provisioning data for the user', async () => {
				const { tokenDto } = setup();

				await uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri');

				expect(provisioningService.getData).toHaveBeenCalledWith('systemId', tokenDto.idToken, tokenDto.accessToken);
			});

			it('should migrate the user successfully', async () => {
				const { oauthData } = setup();

				await uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri');

				expect(userMigrationService.migrateUser).toHaveBeenCalledWith(
					'currentUserId',
					oauthData.externalUser.externalId,
					'systemId'
				);
			});

			it('should remove the jwt from the whitelist', async () => {
				setup();

				await uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri');

				expect(authenticationService.removeJwtFromWhitelist).toHaveBeenCalledWith('jwt');
			});
		});

		describe('when external school and official school number is defined and school has to be migrated', () => {
			const setup = () => {
				const sourceSystem: SystemEntity = systemFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS });

				const schoolDO: LegacySchoolDo = legacySchoolDoFactory.buildWithId({
					systems: [sourceSystem.id],
					officialSchoolNumber: 'officialSchoolNumber',
					externalId: 'oldSchoolExternalId',
				});

				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
					}),
					externalUser: new ExternalUserDto({
						externalId: 'externalUserId',
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: 'externalId',
						officialSchoolNumber: 'officialSchoolNumber',
						name: 'schoolName',
					}),
				});
				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				oAuthService.authenticateUser.mockResolvedValueOnce(tokenDto);
				provisioningService.getData.mockResolvedValueOnce(oauthData);
				schoolMigrationService.getSchoolForMigration.mockResolvedValueOnce(schoolDO);

				return {
					schoolDO,
					oauthData,
				};
			};

			it('should get the school that should be migrated', async () => {
				const { oauthData } = setup();

				await uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri');

				expect(schoolMigrationService.getSchoolForMigration).toHaveBeenCalledWith(
					'currentUserId',
					oauthData.externalSchool?.externalId,
					oauthData.externalSchool?.officialSchoolNumber
				);
			});

			it('should migrate the school', async () => {
				const { oauthData, schoolDO } = setup();

				await uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri');

				expect(schoolMigrationService.migrateSchool).toHaveBeenCalledWith(
					schoolDO,
					oauthData.externalSchool?.externalId,
					'systemId'
				);
			});
		});

		describe('when external school and official school number is defined and school is already migrated', () => {
			const setup = () => {
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
					}),
					externalUser: new ExternalUserDto({
						externalId: 'externalUserId',
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: 'externalId',
						officialSchoolNumber: 'officialSchoolNumber',
						name: 'schoolName',
					}),
				});

				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				oAuthService.authenticateUser.mockResolvedValueOnce(tokenDto);
				provisioningService.getData.mockResolvedValueOnce(oauthData);
				schoolMigrationService.getSchoolForMigration.mockResolvedValueOnce(null);

				return {
					oauthData,
				};
			};

			it('should not migrate the school', async () => {
				setup();

				await uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri');

				expect(schoolMigrationService.migrateSchool).not.toHaveBeenCalled();
			});
		});

		describe('when external school is not defined', () => {
			const setup = () => {
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
					}),
					externalUser: new ExternalUserDto({
						externalId: 'externalUserId',
					}),
				});

				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				oAuthService.authenticateUser.mockResolvedValueOnce(tokenDto);
				provisioningService.getData.mockResolvedValueOnce(oauthData);
				schoolMigrationService.getSchoolForMigration.mockResolvedValueOnce(null);
			};

			it('should try to migrate the school', async () => {
				setup();

				await uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri');

				expect(schoolMigrationService.getSchoolForMigration).not.toHaveBeenCalled();
				expect(schoolMigrationService.migrateSchool).not.toHaveBeenCalled();
			});
		});

		describe('when a external school is defined, but has no official school number', () => {
			const setup = () => {
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
					}),
					externalUser: new ExternalUserDto({
						externalId: 'externalUserId',
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: 'externalId',
						name: 'schoolName',
					}),
				});

				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				oAuthService.authenticateUser.mockResolvedValueOnce(tokenDto);
				provisioningService.getData.mockResolvedValueOnce(oauthData);
				schoolMigrationService.getSchoolForMigration.mockResolvedValueOnce(null);

				return {
					oauthData,
				};
			};

			it('should throw an error', async () => {
				const { oauthData } = setup();

				await expect(uc.migrate('jwt', 'currentUserId', 'systemId', 'code', 'redirectUri')).rejects.toThrow(
					new ExternalSchoolNumberMissingLoggableException(oauthData.externalSchool?.externalId as string)
				);
			});
		});
	});
});
