import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { OauthConfig, System } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { DefaultEncryptionService, IEncryptionService, SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { setupEntities, userDoFactory } from '@shared/testing';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { Logger } from '@src/core/logger';
import { ProvisioningDto, ProvisioningService } from '@src/modules/provisioning';
import { ExternalSchoolDto, ExternalUserDto, OauthDataDto, ProvisioningSystemDto } from '@src/modules/provisioning/dto';
import { OauthConfigDto } from '@src/modules/system/service';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemService } from '@src/modules/system/service/system.service';
import { UserService } from '@src/modules/user';
import { MigrationCheckService, UserMigrationService } from '@src/modules/user-login-migration';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { OAuthTokenDto } from '../interface';
import { OauthTokenResponse } from './dto';
import { OauthAdapterService } from './oauth-adapter.service';
import { OAuthService } from './oauth.service';

jest.mock('jwks-rsa', () => () => {
	return {
		getKeys: jest.fn(),
		getSigningKey: jest.fn().mockResolvedValue({
			kid: 'kid',
			alg: 'alg',
			getPublicKey: jest.fn().mockReturnValue('publicKey'),
			rsaPublicKey: 'publicKey',
		}),
		getSigningKeys: jest.fn(),
	};
});

jest.mock('jsonwebtoken');

describe('OAuthService', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let service: OAuthService;

	let oAuthEncryptionService: DeepMocked<SymetricKeyEncryptionService>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let userService: DeepMocked<UserService>;
	let systemService: DeepMocked<SystemService>;
	let userMigrationService: DeepMocked<UserMigrationService>;
	let oauthAdapterService: DeepMocked<OauthAdapterService>;
	let migrationCheckService: DeepMocked<MigrationCheckService>;

	let testSystem: System;
	let testOauthConfig: OauthConfig;

	const hostUri = 'https://mock.de';

	beforeAll(async () => {
		orm = await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				OAuthService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<IEncryptionService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ProvisioningService,
					useValue: createMock<ProvisioningService>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: UserMigrationService,
					useValue: createMock<UserMigrationService>(),
				},
				{
					provide: OauthAdapterService,
					useValue: createMock<OauthAdapterService>(),
				},
				{
					provide: MigrationCheckService,
					useValue: createMock<MigrationCheckService>(),
				},
			],
		}).compile();
		service = module.get(OAuthService);

		oAuthEncryptionService = module.get(DefaultEncryptionService);
		provisioningService = module.get(ProvisioningService);
		userService = module.get(UserService);
		systemService = module.get(SystemService);
		userMigrationService = module.get(UserMigrationService);
		oauthAdapterService = module.get(OauthAdapterService);
		migrationCheckService = module.get(MigrationCheckService);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	beforeEach(() => {
		jest.spyOn(Configuration, 'get').mockImplementation((key: string): unknown => {
			switch (key) {
				case 'HOST':
				case 'PUBLIC_BACKEND_URL':
					return hostUri;
				default:
					throw new Error(`No mock for key '${key}'`);
			}
		});

		testSystem = systemFactory.withOauthConfig().buildWithId();
		testOauthConfig = testSystem.oauthConfig as OauthConfig;
	});

	describe('requestToken', () => {
		const setupRequest = () => {
			const code = '43534543jnj543342jn2';
			const tokenResponse: OauthTokenResponse = {
				access_token: 'accessToken',
				refresh_token: 'refreshToken',
				id_token: 'idToken',
			};

			return {
				code,
				tokenResponse,
			};
		};

		beforeEach(() => {
			const { tokenResponse } = setupRequest();
			oAuthEncryptionService.decrypt.mockReturnValue('decryptedSecret');
			oauthAdapterService.sendAuthenticationCodeTokenRequest.mockResolvedValue(tokenResponse);
		});

		describe('when it requests a token', () => {
			it('should get token from the external server', async () => {
				const { code, tokenResponse } = setupRequest();

				const result: OAuthTokenDto = await service.requestToken(code, testOauthConfig, 'redirectUri');

				expect(result).toEqual<OAuthTokenDto>({
					idToken: tokenResponse.id_token,
					accessToken: tokenResponse.access_token,
					refreshToken: tokenResponse.refresh_token,
				});
			});
		});
	});

	describe('validateToken', () => {
		afterEach(() => {
			jest.clearAllMocks();
		});
		describe('when the token is validated', () => {
			it('should validate id_token and return it decoded', async () => {
				jest.spyOn(jwt, 'verify').mockImplementationOnce((): JwtPayload => {
					return { sub: 'mockSub' };
				});

				const decodedJwt = await service.validateToken('idToken', testOauthConfig);

				expect(decodedJwt.sub).toStrictEqual('mockSub');
			});
		});

		describe('if no payload was returned', () => {
			it('should throw', async () => {
				jest.spyOn(jwt, 'verify').mockImplementationOnce((): string => 'string');

				await expect(service.validateToken('idToken', testOauthConfig)).rejects.toEqual(
					new OAuthSSOError('Failed to validate idToken', 'sso_token_verfication_error')
				);
			});
		});
	});

	describe('getPostLoginRedirectUrl is called', () => {
		describe('when the oauth provider is iserv', () => {
			it('should return an iserv login url string', async () => {
				const system: SystemDto = new SystemDto({
					type: 'oauth',
					oauthConfig: {
						provider: 'iserv',
						logoutEndpoint: 'http://iserv.de/logout',
					} as OauthConfigDto,
				});
				systemService.findById.mockResolvedValue(system);

				const result: string = await service.getPostLoginRedirectUrl('idToken', 'systemId');

				expect(result).toEqual(
					`http://iserv.de/logout?id_token_hint=idToken&post_logout_redirect_uri=https%3A%2F%2Fmock.de%2Fdashboard`
				);
			});
		});

		describe('when it is called with a postLoginRedirect and the provider is not iserv', () => {
			it('should return the postLoginRedirect', async () => {
				const system: SystemDto = new SystemDto({ type: 'oauth' });
				systemService.findById.mockResolvedValue(system);

				const result: string = await service.getPostLoginRedirectUrl('idToken', 'systemId', 'postLoginRedirect');

				expect(result).toEqual('postLoginRedirect');
			});
		});

		describe('when it is called with any other oauth provider', () => {
			it('should return a login url string', async () => {
				const system: SystemDto = new SystemDto({ type: 'oauth' });
				systemService.findById.mockResolvedValue(system);

				const result: string = await service.getPostLoginRedirectUrl('idToken', 'systemId');

				expect(result).toEqual(`${hostUri}/dashboard`);
			});
		});
	});

	describe('authenticateUser is called', () => {
		const setup = () => {
			const authCode = '43534543jnj543342jn2';

			const oauthConfig: OauthConfigDto = new OauthConfigDto({
				clientId: '12345',
				clientSecret: 'mocksecret',
				alias: 'alias',
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

			return {
				authCode,
				system,
				oauthTokenResponse,
				oauthConfig,
			};
		};

		describe('when system does not have oauth config', () => {
			it('should authenticate a user', async () => {
				const { authCode, system, oauthTokenResponse } = setup();
				systemService.findById.mockResolvedValue(testSystem);
				oAuthEncryptionService.decrypt.mockReturnValue('decryptedSecret');
				oauthAdapterService.getPublicKey.mockResolvedValue('publicKey');
				oauthAdapterService.sendAuthenticationCodeTokenRequest.mockResolvedValue(oauthTokenResponse);

				const result: OAuthTokenDto = await service.authenticateUser(system.id!, 'redirectUri', authCode);

				expect(result).toEqual<OAuthTokenDto>({
					accessToken: oauthTokenResponse.access_token,
					idToken: oauthTokenResponse.id_token,
					refreshToken: oauthTokenResponse.refresh_token,
				});
			});
		});

		describe('when system does not have oauth config', () => {
			it('the authentication should fail', async () => {
				const { authCode, system } = setup();
				system.oauthConfig = undefined;

				systemService.findById.mockResolvedValueOnce(system);

				const func = () => service.authenticateUser(testSystem.id, 'redirectUri', authCode);

				await expect(func).rejects.toThrow(
					new OAuthSSOError(`Requested system ${testSystem.id} has no oauth configured`, 'sso_internal_error')
				);
			});
		});

		describe('when query has an error code', () => {
			it('should throw an error', async () => {
				const func = () => service.authenticateUser('systemId', 'redirectUri', undefined, 'errorCode');

				await expect(func).rejects.toThrow(
					new OAuthSSOError('Authorization Query Object has no authorization code or error', 'errorCode')
				);
			});
		});

		describe('when query has no code and no error', () => {
			it('should throw an error', async () => {
				const func = () => service.authenticateUser('systemId', 'redirectUri');

				await expect(func).rejects.toThrow(
					new OAuthSSOError('Authorization Query Object has no authorization code or error', 'sso_auth_code_step')
				);
			});
		});
	});

	describe('provisionUser is called', () => {
		describe('when only provisioning a user', () => {
			it('should return the user and a redirect', async () => {
				const externalUserId = 'externalUserId';
				const user: UserDO = userDoFactory.buildWithId({ externalId: externalUserId });
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
				});
				const provisioningDto: ProvisioningDto = new ProvisioningDto({
					externalUserId,
				});

				provisioningService.getData.mockResolvedValue(oauthData);
				provisioningService.provisionData.mockResolvedValue(provisioningDto);
				userService.findByExternalId.mockResolvedValue(user);

				const result: { user?: UserDO; redirect: string } = await service.provisionUser(
					'systemId',
					'idToken',
					'accessToken'
				);

				expect(result).toEqual<{ user?: UserDO; redirect: string }>({
					user,
					redirect: `${hostUri}/dashboard`,
				});
			});
		});

		describe('when provisioning a user that should migrate, but the user does not exist', () => {
			it('should return a redirect to the migration page and skip provisioning', async () => {
				const migrationRedirectUrl = 'migrationRedirectUrl';
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalUser: new ExternalUserDto({
						externalId: 'externalUserId',
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: 'schoolExternalId',
						name: 'externalSchool',
						officialSchoolNumber: 'officialSchoolNumber',
					}),
				});

				provisioningService.getData.mockResolvedValue(oauthData);
				migrationCheckService.shouldUserMigrate.mockResolvedValue(true);
				userMigrationService.getMigrationConsentPageRedirect.mockResolvedValue(migrationRedirectUrl);
				userService.findByExternalId.mockResolvedValue(null);

				const result: { user?: UserDO; redirect: string } = await service.provisionUser(
					'systemId',
					'idToken',
					'accessToken'
				);

				expect(result).toEqual<{ user?: UserDO; redirect: string }>({
					user: undefined,
					redirect: migrationRedirectUrl,
				});
				expect(provisioningService.provisionData).not.toHaveBeenCalled();
			});
		});

		describe('when provisioning an existing user that should migrate', () => {
			it('should return a redirect to the migration page and provision the user', async () => {
				const migrationRedirectUrl = 'migrationRedirectUrl';
				const externalUserId = 'externalUserId';
				const user: UserDO = userDoFactory.buildWithId({ externalId: externalUserId });
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: 'schoolExternalId',
						name: 'externalSchool',
						officialSchoolNumber: 'officialSchoolNumber',
					}),
				});

				provisioningService.getData.mockResolvedValue(oauthData);
				migrationCheckService.shouldUserMigrate.mockResolvedValue(true);
				userMigrationService.getMigrationConsentPageRedirect.mockResolvedValue(migrationRedirectUrl);
				userService.findByExternalId.mockResolvedValue(user);

				const result: { user?: UserDO; redirect: string } = await service.provisionUser(
					'systemId',
					'idToken',
					'accessToken'
				);

				expect(result).toEqual<{ user?: UserDO; redirect: string }>({
					user,
					redirect: migrationRedirectUrl,
				});
				expect(provisioningService.provisionData).toHaveBeenCalled();
			});
		});

		describe('when the user cannot be found after provisioning', () => {
			it('should throw an error', async () => {
				const externalUserId = 'externalUserId';
				const oauthData: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalUser: new ExternalUserDto({
						externalId: externalUserId,
					}),
				});
				const provisioningDto: ProvisioningDto = new ProvisioningDto({
					externalUserId,
				});

				provisioningService.getData.mockResolvedValue(oauthData);
				provisioningService.provisionData.mockResolvedValue(provisioningDto);
				userService.findByExternalId.mockResolvedValue(null);

				const func = () => service.provisionUser('systemId', 'idToken', 'accessToken');

				await expect(func).rejects.toThrow(
					new OAuthSSOError(`Provisioning of user with externalId: ${externalUserId} failed`, 'sso_user_notfound')
				);
			});
		});
	});

	describe('getAuthenticationUrl is called', () => {
		describe('when a normal authentication url is requested', () => {
			it('should return a authentication url', () => {
				const oauthConfig: OauthConfig = new OauthConfig({
					alias: 'alias',
					clientId: '12345',
					clientSecret: 'mocksecret',
					tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
					grantType: 'authorization_code',
					redirectUri: 'http://mockhost:3030/api/v3/sso/oauth/testsystemId',
					scope: 'openid uuid',
					responseType: 'code',
					authEndpoint: 'http://mock.de/auth',
					provider: 'mock_type',
					logoutEndpoint: 'http://mock.de/logout',
					issuer: 'mock_issuer',
					jwksEndpoint: 'http://mock.de/jwks',
				});

				const result: string = service.getAuthenticationUrl('oidc', oauthConfig, 'state', false, 'alias');

				expect(result).toEqual(
					'http://mock.de/auth?client_id=12345&redirect_uri=https%3A%2F%2Fmock.de%2Fapi%2Fv3%2Fsso%2Foauth&response_type=code&scope=openid+uuid&state=state&kc_idp_hint=alias'
				);
			});
		});

		describe('when a migration authentication url is requested', () => {
			it('should return a authentication url', () => {
				const oauthConfig: OauthConfig = new OauthConfig({
					alias: 'alias',
					clientId: '12345',
					clientSecret: 'mocksecret',
					tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
					grantType: 'authorization_code',
					redirectUri: 'http://mockhost.de/api/v3/sso/oauth/testsystemId',
					scope: 'openid uuid',
					responseType: 'code',
					authEndpoint: 'http://mock.de/auth',
					provider: 'mock_type',
					logoutEndpoint: 'http://mock.de/logout',
					issuer: 'mock_issuer',
					jwksEndpoint: 'http://mock.de/jwks',
				});

				const result: string = service.getAuthenticationUrl('oidc', oauthConfig, 'state', true, 'alias');

				expect(result).toEqual(
					'http://mock.de/auth?client_id=12345&redirect_uri=https%3A%2F%2Fmock.de%2Fapi%2Fv3%2Fsso%2Foauth%2Fmigration&response_type=code&scope=openid+uuid&state=state&kc_idp_hint=alias'
				);
			});
		});
	});
});
