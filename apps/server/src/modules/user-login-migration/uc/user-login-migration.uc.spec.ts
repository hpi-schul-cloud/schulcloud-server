import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Page, SchoolDO, System, UserLoginMigrationDO } from '@shared/domain';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { schoolDOFactory, systemFactory, userLoginMigrationDOFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { AuthenticationService } from '@src/modules/authentication/services/authentication.service';
import { OAuthTokenDto } from '@src/modules/oauth';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { ProvisioningService } from '@src/modules/provisioning';
import { ExternalSchoolDto, ExternalUserDto, OauthDataDto, ProvisioningSystemDto } from '@src/modules/provisioning/dto';
import { SchoolService } from '@src/modules/school';
import { AuthorizationService } from '@src/modules/authorization';
import { Oauth2MigrationParams } from '../controller/dto/oauth2-migration.params';
import { OAuthMigrationError, SchoolMigrationError, UserLoginMigrationError } from '../error';
import { PageTypes } from '../interface/page-types.enum';
import { SchoolMigrationService, UserLoginMigrationService, UserMigrationService } from '../service';
import { MigrationDto, PageContentDto } from '../service/dto';
import { UserLoginMigrationUc } from './user-login-migration.uc';

describe('UserLoginMigrationUc', () => {
	let module: TestingModule;
	let uc: UserLoginMigrationUc;

	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let oAuthService: DeepMocked<OAuthService>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let schoolMigrationService: DeepMocked<SchoolMigrationService>;
	let userMigrationService: DeepMocked<UserMigrationService>;
	let authenticationService: DeepMocked<AuthenticationService>;
	let logger: DeepMocked<LegacyLogger>;

	beforeAll(async () => {
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
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
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
		logger = module.get(LegacyLogger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getPageContent is called', () => {
		describe('when it should get page-content', () => {
			const setup = () => {
				const dto: PageContentDto = {
					proceedButtonUrl: 'proceed',
					cancelButtonUrl: 'cancel',
				};

				userMigrationService.getPageContent.mockResolvedValue(dto);

				return { dto };
			};

			it('should return a response', async () => {
				const { dto } = setup();

				const testResp: PageContentDto = await uc.getPageContent(
					PageTypes.START_FROM_TARGET_SYSTEM,
					'source',
					'target'
				);

				expect(testResp.proceedButtonUrl).toEqual(dto.proceedButtonUrl);
				expect(testResp.cancelButtonUrl).toEqual(dto.cancelButtonUrl);
			});
		});
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

				userLoginMigrationService.findMigrationByUser.mockResolvedValue(migrations);

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

				userLoginMigrationService.findMigrationByUser.mockResolvedValue(null);

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

	describe('migrate', () => {
		describe('when user migrates the from one to another system', () => {
			const setupMigration = () => {
				const query: Oauth2MigrationParams = new Oauth2MigrationParams();
				query.code = 'code';
				query.systemId = 'systemId';
				query.redirectUri = 'redirectUri';

				const sourceSystem: System = systemFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS });

				const schoolDO: SchoolDO = schoolDOFactory.buildWithId({
					systems: [sourceSystem.id],
					officialSchoolNumber: 'officialSchoolNumber',
					externalId: 'oldSchoolExternalId',
				});
				const externalUserId = 'externalUserId';

				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
					}),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: 'externalId',
						officialSchoolNumber: 'officialSchoolNumber',
						name: 'schoolName',
					}),
				});

				const userMigrationDto: MigrationDto = new MigrationDto({
					redirect: 'https://mock.de/migration/succeed',
				});

				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				oAuthService.authenticateUser.mockResolvedValue(tokenDto);
				provisioningService.getData.mockResolvedValue(oauthData);
				schoolMigrationService.schoolToMigrate.mockResolvedValue(schoolDO);
				userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

				const message1 = `MIGRATION (userId: currentUserId): Migrates to targetSystem with id ${oauthData.system.systemId}`;

				const message2 = `MIGRATION (userId: currentUserId): Provisioning data received from targetSystem (${
					oauthData.system.systemId ?? 'N/A'
				} with data: 
			{ 
				"officialSchoolNumber": ${oauthData.externalSchool?.officialSchoolNumber ?? 'N/A'},
				"externalSchoolId": ${oauthData.externalSchool?.externalId ?? ''}
				"externalUserId": ${oauthData.externalUser.externalId},
			})`;

				const message3 = `MIGRATION (userId: currentUserId): Found school with officialSchoolNumber (${
					oauthData.externalSchool?.officialSchoolNumber ?? ''
				})`;

				return {
					query,
					userMigrationDto,
					oauthData,
					tokenDto,
					message1,
					message2,
					message3,
				};
			};

			it('should call authenticate User', async () => {
				const { query } = setupMigration();

				await uc.migrate('jwt', 'currentUserId', query.systemId, query.code, query.redirectUri);

				expect(oAuthService.authenticateUser).toHaveBeenCalledWith(query.systemId, query.redirectUri, query.code);
			});

			it('should call get provisioning data', async () => {
				const { query, tokenDto } = setupMigration();

				await uc.migrate('jwt', 'currentUserId', query.systemId, query.code, query.redirectUri);

				expect(provisioningService.getData).toHaveBeenCalledWith(
					query.systemId,
					tokenDto.idToken,
					tokenDto.accessToken
				);
			});

			it('should call migrate user successfully', async () => {
				const { query, oauthData } = setupMigration();

				await uc.migrate('jwt', 'currentUserId', query.systemId, query.code, query.redirectUri);

				expect(userMigrationService.migrateUser).toHaveBeenCalledWith(
					'currentUserId',
					oauthData.externalUser.externalId,
					query.systemId
				);
			});

			it('should remove the jwt from the whitelist', async () => {
				const { query } = setupMigration();

				await uc.migrate('jwt', 'currentUserId', query.systemId, query.code, query.redirectUri);

				expect(authenticationService.removeJwtFromWhitelist).toHaveBeenCalledWith('jwt');
			});
		});

		describe('when migration of user failed', () => {
			const setupMigration = () => {
				const query: Oauth2MigrationParams = new Oauth2MigrationParams();
				query.code = 'code';
				query.systemId = 'systemId';
				query.redirectUri = 'redirectUri';

				const sourceSystem: System = systemFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS });

				const schoolDO: SchoolDO = schoolDOFactory.buildWithId({
					systems: [sourceSystem.id],
					officialSchoolNumber: 'officialSchoolNumber',
					externalId: 'oldSchoolExternalId',
				});

				const externalUserId = 'externalUserId';

				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
					}),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: 'externalId',
						officialSchoolNumber: 'officialSchoolNumber',
						name: 'schoolName',
					}),
				});

				const userMigrationDto: MigrationDto = new MigrationDto({
					redirect: 'https://mock.de/migration/error',
				});

				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				oAuthService.authenticateUser.mockResolvedValue(tokenDto);
				provisioningService.getData.mockResolvedValue(oauthData);
				schoolMigrationService.schoolToMigrate.mockResolvedValue(schoolDO);
				userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

				return {
					query,
					userMigrationDto,
				};
			};

			it('should throw UserloginMigrationError', async () => {
				const { query } = setupMigration();

				const func = () => uc.migrate('jwt', 'currentUserId', query.systemId, query.code, query.redirectUri);

				await expect(func).rejects.toThrow(new UserLoginMigrationError());
			});
		});

		describe('when schoolnumbers mismatch', () => {
			const setupMigration = () => {
				const query: Oauth2MigrationParams = new Oauth2MigrationParams();
				query.code = 'code';
				query.systemId = 'systemId';
				query.redirectUri = 'redirectUri';

				const sourceSystem: System = systemFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS });

				const schoolDO: SchoolDO = schoolDOFactory.buildWithId({
					systems: [sourceSystem.id],
					officialSchoolNumber: 'officialSchoolNumber',
					externalId: 'oldSchoolExternalId',
				});

				const externalUserId = 'externalUserId';

				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
					}),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: 'externalId',
						officialSchoolNumber: 'officialSchoolNumber',
						name: 'schoolName',
					}),
				});

				const userMigrationDto: MigrationDto = new MigrationDto({
					redirect: 'https://mock.de/migration/error',
				});

				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				const error: OAuthMigrationError = new OAuthMigrationError(
					'Current users school is not the same as school found by official school number from target migration system',
					'ext_official_school_number_mismatch',
					schoolDO.officialSchoolNumber,
					oauthData.externalSchool?.officialSchoolNumber
				);

				oAuthService.authenticateUser.mockResolvedValue(tokenDto);
				provisioningService.getData.mockResolvedValue(oauthData);
				schoolMigrationService.schoolToMigrate.mockRejectedValue(error);
				userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

				return {
					query,
					userMigrationDto,
					error,
				};
			};

			it('should throw SchoolMigrationError', async () => {
				const { query, error } = setupMigration();

				const func = () => uc.migrate('jwt', 'currentUserId', query.systemId, query.code, query.redirectUri);

				await expect(func).rejects.toThrow(
					new SchoolMigrationError({
						sourceSchoolNumber: error.officialSchoolNumberFromSource,
						targetSchoolNumber: error.officialSchoolNumberFromTarget,
					})
				);
			});
		});

		describe('when school is missing', () => {
			const setupMigration = () => {
				const query: Oauth2MigrationParams = new Oauth2MigrationParams();
				query.code = 'code';
				query.systemId = 'systemId';
				query.redirectUri = 'redirectUri';

				const externalUserId = 'externalUserId';

				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
					}),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: 'externalId',
						officialSchoolNumber: 'officialSchoolNumber',
						name: 'schoolName',
					}),
				});

				const userMigrationDto: MigrationDto = new MigrationDto({
					redirect: 'https://mock.de/migration/error',
				});

				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				const error: OAuthMigrationError = new OAuthMigrationError(
					'Official school number from target migration system is missing',
					'ext_official_school_number_missing'
				);

				oAuthService.authenticateUser.mockResolvedValue(tokenDto);
				provisioningService.getData.mockResolvedValue(oauthData);
				schoolMigrationService.schoolToMigrate.mockRejectedValue(error);
				userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

				return {
					query,
					userMigrationDto,
				};
			};

			it('should throw SchoolMigrationError', async () => {
				const { query } = setupMigration();

				const func = () => uc.migrate('jwt', 'currentUserId', query.systemId, query.code, query.redirectUri);

				await expect(func).rejects.toThrow(new SchoolMigrationError());
			});
		});

		describe('when external school and official school number is defined and school has to be migrated', () => {
			const setupMigration = () => {
				const query: Oauth2MigrationParams = new Oauth2MigrationParams();
				query.code = 'code';
				query.systemId = 'systemId';
				query.redirectUri = 'redirectUri';

				const sourceSystem: System = systemFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS });

				const schoolDO: SchoolDO = schoolDOFactory.buildWithId({
					systems: [sourceSystem.id],
					officialSchoolNumber: 'officialSchoolNumber',
					externalId: 'oldSchoolExternalId',
				});

				const externalUserId = 'externalUserId';

				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
					}),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: 'externalId',
						officialSchoolNumber: 'officialSchoolNumber',
						name: 'schoolName',
					}),
				});

				const userMigrationDto: MigrationDto = new MigrationDto({
					redirect: 'https://mock.de/dashboard',
				});

				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				oAuthService.authenticateUser.mockResolvedValue(tokenDto);
				provisioningService.getData.mockResolvedValue(oauthData);
				schoolMigrationService.schoolToMigrate.mockResolvedValue(schoolDO);
				userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

				const text = `Successfully migrated school (${schoolDO.name} - (${schoolDO.id ?? 'N/A'}) to targetSystem ${
					query.systemId ?? 'N/A'
				} which has the externalSchoolId ${oauthData.externalSchool?.externalId ?? 'N/A'}`;

				const message = `MIGRATION (userId: currentUserId): ${text ?? ''}`;

				return {
					query,
					userMigrationDto,
					schoolDO,
					oauthData,
					message,
				};
			};

			it('should call schoolToMigrate', async () => {
				const { oauthData, query } = setupMigration();

				await uc.migrate('jwt', 'currentUserId', query.systemId, query.code, query.redirectUri);

				expect(schoolMigrationService.schoolToMigrate).toHaveBeenCalledWith(
					'currentUserId',
					oauthData.externalSchool?.externalId,
					oauthData.externalSchool?.officialSchoolNumber
				);
			});

			it('should call migrateSchool', async () => {
				const { oauthData, query, schoolDO } = setupMigration();

				await uc.migrate('jwt', 'currentUserId', query.systemId, query.code, query.redirectUri);

				expect(schoolMigrationService.migrateSchool).toHaveBeenCalledWith(
					oauthData.externalSchool?.externalId,
					schoolDO,
					'systemId'
				);
			});

			it('should log migration information', async () => {
				const { query, message } = setupMigration();

				await uc.migrate('jwt', 'currentUserId', query.systemId, query.code, query.redirectUri);

				expect(logger.debug).toHaveBeenCalledWith(message);
			});
		});

		describe('when external school and official school number is defined and school is already migrated', () => {
			const setupMigration = () => {
				const query: Oauth2MigrationParams = new Oauth2MigrationParams();
				query.code = 'code';
				query.systemId = 'systemId';
				query.redirectUri = 'redirectUri';

				const externalUserId = 'externalUserId';

				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
					}),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: 'externalId',
						officialSchoolNumber: 'officialSchoolNumber',
						name: 'schoolName',
					}),
				});

				const userMigrationDto: MigrationDto = new MigrationDto({
					redirect: 'https://mock.de/dashboard',
				});

				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				oAuthService.authenticateUser.mockResolvedValue(tokenDto);
				provisioningService.getData.mockResolvedValue(oauthData);
				schoolMigrationService.schoolToMigrate.mockResolvedValue(null);
				schoolMigrationService.schoolToMigrate.mockResolvedValueOnce(null);
				schoolMigrationService.migrateSchool.mockResolvedValue();
				userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

				const message = `MIGRATION (userId: currentUserId): Found school with officialSchoolNumber (officialSchoolNumber)`;

				return {
					query,
					userMigrationDto,
					oauthData,
					message,
				};
			};

			it('should not call migrateSchool', async () => {
				const { query } = setupMigration();

				await uc.migrate('jwt', 'currentUserId', query.systemId, query.code, query.redirectUri);

				expect(schoolMigrationService.migrateSchool).not.toHaveBeenCalled();
			});

			it('should log migration information', async () => {
				const { query, message } = setupMigration();

				await uc.migrate('jwt', 'currentUserId', query.systemId, query.code, query.redirectUri);

				expect(logger.debug).toHaveBeenCalledWith(message);
			});
		});

		describe('when external school is not defined', () => {
			const setupMigration = () => {
				const query: Oauth2MigrationParams = new Oauth2MigrationParams();
				query.code = 'code';
				query.systemId = 'systemId';
				query.redirectUri = 'redirectUri';

				const externalUserId = 'externalUserId';

				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.SANIS,
					}),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
				});

				const userMigrationDto: MigrationDto = new MigrationDto({
					redirect: 'https://mock.de/dashboard',
				});

				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				oAuthService.authenticateUser.mockResolvedValue(tokenDto);
				provisioningService.getData.mockResolvedValue(oauthData);
				schoolMigrationService.schoolToMigrate.mockResolvedValueOnce(null);
				userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

				const message = `Provisioning data received from targetSystem (${oauthData.system.systemId ?? 'N/A'} with data: 
			{ 
				"officialSchoolNumber": ${oauthData.externalSchool?.officialSchoolNumber ?? 'N/A'},
				"externalSchoolId": ${oauthData.externalSchool?.externalId ?? ''}
				"externalUserId": ${oauthData.externalUser.externalId},
			})`;

				return {
					query,
					userMigrationDto,
					message,
				};
			};

			it('should not call schoolToMigrate', async () => {
				const { query } = setupMigration();

				await uc.migrate('jwt', 'currentUserId', query.systemId, query.code, query.redirectUri);

				expect(schoolMigrationService.schoolToMigrate).not.toHaveBeenCalled();
			});
		});
	});
});
