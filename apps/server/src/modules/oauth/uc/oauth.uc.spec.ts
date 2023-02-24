import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { OauthUc } from '@src/modules/oauth/uc/oauth.uc';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SystemService } from '@src/modules/system/service/system.service';
import { UserService } from '@src/modules/user';
import { UserMigrationService } from '@src/modules/migration';
import { NotFoundException } from '@nestjs/common';
import { OauthConfigDto, SystemDto } from '@src/modules/system/service';
import { SchoolService } from '@src/modules/school';
import { SchoolMigrationService } from '@src/modules/migration/service';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { FeathersJwtProvider } from '@src/modules/authorization';
import { ProvisioningService } from '@src/modules/provisioning';
import { OAuthMigrationError } from '@src/modules/migration/error/oauth-migration.error';
import { MigrationDto } from '@src/modules/migration/service/dto/migration.dto';
import { AuthorizationParams, OauthTokenResponse } from '../controller/dto';
import { OAuthProcessDto } from '../service/dto/oauth-process.dto';
import { OAuthService } from '../service/oauth.service';
import { ExternalUserDto, OauthDataDto, ProvisioningSystemDto } from '../../provisioning/dto';
import resetAllMocks = jest.resetAllMocks;

describe('OAuthUc', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let uc: OauthUc;

	let oauthService: DeepMocked<OAuthService>;
	let systemService: DeepMocked<SystemService>;
	let jwtService: DeepMocked<FeathersJwtProvider>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let userMigrationService: DeepMocked<UserMigrationService>;
	let schoolMigrationService: DeepMocked<SchoolMigrationService>;

	beforeAll(async () => {
		orm = await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				OauthUc,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
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
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: UserMigrationService,
					useValue: createMock<UserMigrationService>(),
				},
				{
					provide: SchoolMigrationService,
					useValue: createMock<SchoolMigrationService>(),
				},
				{
					provide: FeathersJwtProvider,
					useValue: createMock<FeathersJwtProvider>(),
				},
			],
		}).compile();
		uc = module.get(OauthUc);
		systemService = module.get(SystemService);
		oauthService = module.get(OAuthService);
		jwtService = module.get(FeathersJwtProvider);
		provisioningService = module.get(ProvisioningService);
		userMigrationService = module.get(UserMigrationService);
		schoolMigrationService = module.get(SchoolMigrationService);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	afterEach(() => {
		resetAllMocks();
	});

	describe('processOAuth is called', () => {
		const setup = () => {
			const code = '43534543jnj543342jn2';
			const query: AuthorizationParams = { code };
			const jwt = 'schulcloudJwt';
			const redirect = 'redirect';
			const baseResponse: OAuthProcessDto = {
				redirect,
			};
			const user: UserDO = new UserDO({
				id: 'mockUserId',
				firstName: 'firstName',
				lastName: 'lastame',
				email: '',
				roleIds: [],
				schoolId: 'mockSchoolId',
				externalId: 'mockExternalId',
			});
			const testSystem: SystemDto = new SystemDto({
				id: 'mockSystemId',
				type: 'mock',
				oauthConfig: { provider: 'testProvider' } as OauthConfigDto,
			});
			return { code, query, jwt, redirect, baseResponse, user, testSystem };
		};
		describe('when a user is returned', () => {
			it('should return a response with a valid jwt', async () => {
				const { code, query, jwt, redirect, baseResponse, user, testSystem } = setup();
				oauthService.checkAuthorizationCode.mockReturnValue(code);
				oauthService.authenticateUser.mockResolvedValue({ user, redirect });
				jwtService.generateJwt.mockResolvedValue(jwt);

				const response: OAuthProcessDto = await uc.processOAuth(query, testSystem.id!);
				expect(response).toEqual(
					expect.objectContaining({
						jwt,
						...baseResponse,
					})
				);
				expect(response.jwt).toStrictEqual(jwt);
			});
		});

		describe('when no user is returned', () => {
			it('should return a response without a jwt', async () => {
				const { code, query, redirect, baseResponse, testSystem } = setup();
				oauthService.checkAuthorizationCode.mockReturnValue(code);
				oauthService.authenticateUser.mockResolvedValue({ redirect });

				const response: OAuthProcessDto = await uc.processOAuth(query, testSystem.id!);
				expect(response).toEqual(
					expect.objectContaining({
						...baseResponse,
					})
				);
			});
		});

		describe('when an error occurs', () => {
			it('should return an OAuthProcessDto with error', async () => {
				const errorResponse: OAuthProcessDto = {
					provider: 'unknown-provider',
					errorCode: 'sso_internal_error',
					redirect: 'errorRedirect',
				};
				const { code, query, testSystem } = setup();
				oauthService.checkAuthorizationCode.mockReturnValue(code);
				oauthService.getOAuthErrorResponse.mockReturnValue(errorResponse);
				oauthService.authenticateUser.mockRejectedValue(new OAuthSSOError('Testmessage'));
				systemService.findOAuthById.mockResolvedValue(testSystem);

				const response: OAuthProcessDto = await uc.processOAuth(query, testSystem.id!);

				expect(response).toEqual(errorResponse);
			});
		});
	});

	describe('migration', () => {
		const setupMigration = () => {
			const code = '43534543jnj543342jn2';

			const query: AuthorizationParams = { code };

			const oauthConfig: OauthConfigDto = new OauthConfigDto({
				clientId: '12345',
				clientSecret: 'mocksecret',
				tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
				grantType: 'authorization_code',
				scope: 'openid uuid',
				responseType: 'code',
				authEndpoint: 'mock_authEndpoint',
				provider: 'mock_provider',
				logoutEndpoint: 'mock_logoutEndpoint',
				issuer: 'mock_issuer',
				jwksEndpoint: 'mock_jwksEndpoint',
				redirectUri: 'mock_codeRedirectUri',
			});
			const system: SystemDto = new SystemDto({
				id: 'systemId',
				type: 'oauth',
				oauthConfig,
			});

			const oauthTokenResponse: OauthTokenResponse = {
				access_token: 'accessToken',
				refresh_token: 'refreshToken',
				id_token: 'idToken',
			};

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
				redirect: 'https://mock.de/migration/succeed',
			});

			const userMigrationFailedDto: MigrationDto = new MigrationDto({
				redirect: 'https://mock.de/dashboard',
			});
			oauthService.checkAuthorizationCode.mockReturnValue(code);

			oauthService.requestToken.mockResolvedValue(oauthTokenResponse);
			provisioningService.getData.mockResolvedValue(oauthData);

			return {
				code,
				query,
				system,
				userMigrationDto,
				userMigrationFailedDto,
				oauthTokenResponse,
				oauthData,
			};
		};

		describe('migrateUser', () => {
			describe('when authorize user and migration was successful', () => {
				it('should return redirect to migration succeed page', async () => {
					const { query, system, userMigrationDto, oauthTokenResponse } = setupMigration();
					systemService.findOAuthById.mockResolvedValue(system);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);
					oauthService.authorizeForMigration.mockResolvedValue(oauthTokenResponse);

					const result: MigrationDto = await uc.migrateUser('currentUserId', query, system.id as string);

				expect(result.redirect).toStrictEqual('https://mock.de/migration/succeed');
			});
		});

			describe('when migration failed', () => {
				it('should return redirect to dashboard ', async () => {
					const { query, system, userMigrationFailedDto, oauthTokenResponse } = setupMigration();
					systemService.findOAuthById.mockResolvedValue(system);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationFailedDto);
					oauthService.authorizeForMigration.mockResolvedValue(oauthTokenResponse);

					const result: MigrationDto = await uc.migrateUser('currentUserId', query, 'systemdId');

					expect(result.redirect).toStrictEqual('https://mock.de/dashboard');
				});
			});
		});

		describe('when system id is not given', () => {
			it('should throw NotFoundException ', async () => {
				const { query } = setupMigration();
				systemService.findOAuthById.mockResolvedValue(systemFactory.build());

				await expect(uc.migrate('currentUserId', query, 'systemdId')).rejects.toThrow(NotFoundException);
			});
		});

		describe('when external school and official school number is defined and school has to be migrated', () => {
			it('should call migrateSchool', async () => {
				const { oauthData, query, system, userMigrationDto } = setupMigration();
				oauthData.externalSchool = {
					externalId: 'mockId',
					officialSchoolNumber: 'mockNumber',
					name: 'mockName',
				};
				const schoolToMigrate: SchoolDO | void = new SchoolDO({ name: 'mockName' });
				systemService.findOAuthById.mockResolvedValue(system);
				schoolMigrationService.schoolToMigrate.mockResolvedValue(schoolToMigrate);
				userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

				await uc.migrate('currentUserId', query, system.id as string);

				expect(schoolMigrationService.migrateSchool).toHaveBeenCalledWith(
					oauthData.externalSchool.externalId,
					schoolToMigrate,
					'systemId'
				);
			});
		});

		describe('when external school and official school number is defined and school is already migrated', () => {
			it('should not call migrateSchool', async () => {
				const { oauthData, query, system, userMigrationDto } = setupMigration();
				oauthData.externalSchool = {
					externalId: 'mockId',
					officialSchoolNumber: 'mockNumber',
					name: 'mockName',
				};
				systemService.findOAuthById.mockResolvedValue(system);
				schoolMigrationService.schoolToMigrate.mockResolvedValue(null);
				userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

				await uc.migrate('currentUserId', query, system.id as string);

				expect(schoolMigrationService.migrateSchool).not.toHaveBeenCalled();
			});
		});

		describe('when external school is not defined', () => {
			it('should not call schoolToMigrate', async () => {
				const { query, system, userMigrationDto } = setupMigration();
				systemService.findOAuthById.mockResolvedValue(system);
				userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

				await uc.migrate('currentUserId', query, system.id as string);

				expect(schoolMigrationService.schoolToMigrate).not.toHaveBeenCalled();
			});
		});

		describe('when official school number is not defined', () => {
			it('should throw OAuthMigrationError', async () => {
				const { oauthData, query, system, userMigrationDto } = setupMigration();
				oauthData.externalSchool = {
					externalId: 'mockId',
					name: 'mockName',
				};
				const error = new OAuthMigrationError(
					'Official school number from target migration system is missing',
					'ext_official_school_number_missing'
				);
				systemService.findOAuthById.mockResolvedValue(system);
				schoolMigrationService.schoolToMigrate.mockImplementation(() => {
					throw error;
				});
				userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

				await expect(uc.migrate('currentUserId', query, system.id as string)).rejects.toThrow(error);
			});
		});
	});
});
