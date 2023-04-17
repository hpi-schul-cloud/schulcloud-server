import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { System, UserLoginMigrationDO } from '@shared/domain';
import { Page } from '@shared/domain/domainobject/page';
import { UserMigrationService } from '@src/modules/user-login-migration/service/user-migration.service';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { systemFactory } from '@shared/testing';
import { schoolDOFactory } from '@shared/testing/factory/domainobject/school.factory';
import { Logger } from '@src/core/logger';
import { OAuthTokenDto } from '@src/modules/oauth/interface/oauth-token.dto';
import { ProvisioningService } from '@src/modules/provisioning/service/provisioning.service';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { AuthenticationService } from '@src/modules/authentication/services/authentication.service';
import { ExternalSchoolDto, ExternalUserDto, OauthDataDto, ProvisioningSystemDto } from '@src/modules/provisioning/dto';
import { PageTypes } from '../interface/page-types.enum';
import { SchoolMigrationService, UserLoginMigrationService } from '../service';
import { PageContentDto } from '../service/dto/page-content.dto';
import { UserLoginMigrationUc } from './user-login-migration.uc';
import { MigrationDto } from '../service/dto/migration.dto';
import { Oauth2AuthorizationParams } from '../controller/dto/request/oauth2-authorization.params';
import clearAllMocks = jest.clearAllMocks;

describe('UserLoginMigrationUc', () => {
	let module: TestingModule;
	let uc: UserLoginMigrationUc;

	let userMigrationService: DeepMocked<UserMigrationService>;
	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let schoolMigrationService: DeepMocked<SchoolMigrationService>;
	let oAuthService: DeepMocked<OAuthService>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let authenticationService: DeepMocked<AuthenticationService>;
	let logger: DeepMocked<Logger>;

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
					provide: SchoolMigrationService,
					useValue: createMock<SchoolMigrationService>(),
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
					provide: AuthenticationService,
					useValue: createMock<AuthenticationService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(UserLoginMigrationUc);
		userMigrationService = module.get(UserMigrationService);
		userLoginMigrationService = module.get(UserLoginMigrationService);
		schoolMigrationService = module.get(SchoolMigrationService);
		oAuthService = module.get(OAuthService);
		provisioningService = module.get(ProvisioningService);
		authenticationService = module.get(AuthenticationService);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		clearAllMocks();
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

				const migrations: Page<UserLoginMigrationDO> = new Page<UserLoginMigrationDO>([], 0);

				userLoginMigrationService.findUserLoginMigrations.mockResolvedValue(migrations);

				return { userId, migrations };
			};

			it('should return a response', async () => {
				const { userId, migrations } = setup();

				const result: Page<UserLoginMigrationDO> = await uc.getMigrations(userId, { userId }, {});

				expect(result).toEqual(migrations);
			});
		});

		describe('when searching for other users migrations', () => {
			const setup = () => {
				const userId = 'userId';

				return { userId };
			};

			it('should return a response', async () => {
				const { userId } = setup();

				const func = async () => uc.getMigrations(userId, { userId: 'otherUserId' }, {});

				await expect(func).rejects.toThrow(
					new ForbiddenException('Accessing migration status of another user is forbidden.')
				);
			});
		});
	});

	describe('migrateUser is called', () => {
		describe('when authorize user and migration was successful', () => {
			const setupMigration = () => {
				const query: Oauth2AuthorizationParams = new Oauth2AuthorizationParams();
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

				await uc.migrateUser('jwt', 'currentUserId', query.systemId, query.redirectUri, query.code);

				expect(oAuthService.authenticateUser).toHaveBeenCalledWith(query.systemId, query.redirectUri, query.code);
			});

			it('should call get provisioning data', async () => {
				const { query, tokenDto } = setupMigration();

				await uc.migrateUser('jwt', 'currentUserId', query.systemId, query.redirectUri, query.code);

				expect(provisioningService.getData).toHaveBeenCalledWith(
					query.systemId,
					tokenDto.idToken,
					tokenDto.accessToken
				);
			});

			it('should call migrate user successfully', async () => {
				const { query, oauthData } = setupMigration();

				await uc.migrateUser('jwt', 'currentUserId', query.systemId, query.redirectUri, query.code);

				expect(userMigrationService.migrateUser).toHaveBeenCalledWith(
					'currentUserId',
					oauthData.externalUser.externalId,
					query.systemId
				);
			});

			it('should remove the jwt from the whitelist', async () => {
				const { query } = setupMigration();

				await uc.migrateUser('jwt', 'currentUserId', query.systemId, query.redirectUri, query.code);

				expect(authenticationService.removeJwtFromWhitelist).toHaveBeenCalledWith('jwt');
			});

			it('should log migration information', async () => {
				const { query, message1, message2, message3 } = setupMigration();

				await uc.migrateUser('jwt', 'currentUserId', query.systemId, query.redirectUri, query.code);

				expect(logger.debug).toHaveBeenCalledWith(message1);
				expect(logger.debug).toHaveBeenCalledWith(message2);
				expect(logger.debug).toHaveBeenCalledWith(message3);
			});
		});

		describe('when migration of user failed', () => {
			const setupMigration = () => {
				const query: Oauth2AuthorizationParams = new Oauth2AuthorizationParams();
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

			it('should throw InternalServerErrorException', async () => {
				const { query } = setupMigration();

				const func = () => uc.migrateUser('jwt', 'currentUserId', query.systemId, query.redirectUri, query.code);

				await expect(func).rejects.toThrow(new InternalServerErrorException('Error during migration of user'));
			});
		});

		describe('when external school and official school number is defined ', () => {
			const setupMigration = () => {
				const query: Oauth2AuthorizationParams = new Oauth2AuthorizationParams();
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

				return {
					query,
					userMigrationDto,
					oauthData,
				};
			};

			it('should call schoolToMigrate', async () => {
				const { oauthData, query } = setupMigration();

				await uc.migrateUser('jwt', 'currentUserId', query.systemId, query.redirectUri, query.code);

				expect(schoolMigrationService.schoolToMigrate).toHaveBeenCalledWith(
					'currentUserId',
					oauthData.externalSchool?.externalId,
					oauthData.externalSchool?.officialSchoolNumber
				);
			});
		});

		describe('when external school and official school number is defined and school has to be migrated', () => {
			const setupMigration = () => {
				const query: Oauth2AuthorizationParams = new Oauth2AuthorizationParams();
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

			it('should call migrateSchool', async () => {
				const { oauthData, query, schoolDO } = setupMigration();

				await uc.migrateUser('jwt', 'currentUserId', query.systemId, query.redirectUri, query.code);

				expect(schoolMigrationService.migrateSchool).toHaveBeenCalledWith(
					oauthData.externalSchool?.externalId,
					schoolDO,
					'systemId'
				);
			});
			it('should log migration information', async () => {
				const { query, message } = setupMigration();

				await uc.migrateUser('jwt', 'currentUserId', query.systemId, query.redirectUri, query.code);

				expect(logger.debug).toHaveBeenCalledWith(message);
			});
		});

		describe('when external school and official school number is defined and school is already migrated', () => {
			const setupMigration = () => {
				const query: Oauth2AuthorizationParams = new Oauth2AuthorizationParams();
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

				await uc.migrateUser('jwt', 'currentUserId', query.systemId, query.redirectUri, query.code);

				expect(schoolMigrationService.migrateSchool).not.toHaveBeenCalled();
			});

			it('should log migration information', async () => {
				const { query, message } = setupMigration();

				await uc.migrateUser('jwt', 'currentUserId', query.systemId, query.redirectUri, query.code);

				expect(logger.debug).toHaveBeenCalledWith(message);
			});
		});

		describe('when external school is not defined', () => {
			const setupMigration = () => {
				const query: Oauth2AuthorizationParams = new Oauth2AuthorizationParams();
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

				await uc.migrateUser('jwt', 'currentUserId', query.systemId, query.redirectUri, query.code);

				expect(schoolMigrationService.schoolToMigrate).not.toHaveBeenCalled();
			});
		});
	});
});
