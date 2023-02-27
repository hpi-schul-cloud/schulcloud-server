import { createMock, DeepMocked } from '@golevelup/ts-jest';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';
import { KeycloakIdentityManagementOauthService } from './keycloak-identity-management-oauth.service';

describe('KeycloakIdentityManagementService', () => {
	let module: TestingModule;
	let kcIdmOauthService: KeycloakIdentityManagementOauthService;
	let kcAdminServiceMock: DeepMocked<KeycloakAdministrationService>;
	let httpServiceMock: DeepMocked<HttpService>;
	let configServiceMock: DeepMocked<ConfigService>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				KeycloakIdentityManagementOauthService,
				{
					provide: KeycloakAdministrationService,
					useValue: createMock<KeycloakAdministrationService>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();
		kcIdmOauthService = module.get(KeycloakIdentityManagementOauthService);
		kcAdminServiceMock = module.get(KeycloakAdministrationService);
		httpServiceMock = module.get(HttpService);
		configServiceMock = module.get(ConfigService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	const setupOauthConfigurationReturn = () => {
		const clientId = 'TheClientId';
		const clientSecret = 'TheClientSecret';
		configServiceMock.get.mockReturnValue('testdomain');
		kcAdminServiceMock.callKcAdminClient.mockResolvedValue({} as KeycloakAdminClient);
		kcAdminServiceMock.getClientId.mockReturnValueOnce(clientId);
		kcAdminServiceMock.getClientSecret.mockResolvedValueOnce(clientSecret);

		httpServiceMock.get.mockReturnValue(
			of({
				data: {
					issuer: 'issuer',
					token_endpoint: 'tokenEndpoint',
					authorization_endpoint: 'authEndpoint',
					end_session_endpoint: 'logoutEndpoint',
					jwks_uri: 'jwksEndpoint',
				},
			} as AxiosResponse)
		);
	};

	describe('getOauthConfig', () => {
		describe('when keycloak is available', () => {
			it('should return the keycloak OAuth static configuration', async () => {
				setupOauthConfigurationReturn();
				const ret = await kcIdmOauthService.getOauthConfig();
				expect(ret.provider).toBe('oauth');
				expect(ret.responseType).toBe('code');
				expect(ret.grantType).toBe('authorization_code');
				expect(ret.scope).toBe('openid profile email');
			});
			it('should return the keycloak OAuth clientId', async () => {
				setupOauthConfigurationReturn();
				const ret = await kcIdmOauthService.getOauthConfig();
				expect(ret.clientId).toBe('TheClientId');
			});
			it('should return the keycloak OAuth clientSecret', async () => {
				setupOauthConfigurationReturn();
				const ret = await kcIdmOauthService.getOauthConfig();
				expect(ret.clientSecret).toBe('TheClientSecret');
			});
			it('should return the keycloak OAuth redirect URI for the given domain', async () => {
				setupOauthConfigurationReturn();
				const ret = await kcIdmOauthService.getOauthConfig();
				expect(ret.redirectUri).toBe('https://testdomain/api/v3/sso/oauth/');
			});
			it('should return the keycloak OAuth configuration from well-known', async () => {
				setupOauthConfigurationReturn();
				const ret = await kcIdmOauthService.getOauthConfig();
				expect(ret.issuer).toBe('issuer');
				expect(ret.tokenEndpoint).toBe('tokenEndpoint');
				expect(ret.authEndpoint).toBe('authEndpoint');
				expect(ret.logoutEndpoint).toBe('logoutEndpoint');
				expect(ret.jwksEndpoint).toBe('jwksEndpoint');
			});
		});
		describe('when localhost is set as SC DOMAIN', () => {
			const setup = () => {
				configServiceMock.get.mockReturnValue('localhost');
			};
			it('should return the keycloak OAuth redirect URL for local development', async () => {
				setupOauthConfigurationReturn();
				setup();
				const ret = await kcIdmOauthService.getOauthConfig();
				expect(ret.redirectUri).toBe('http://localhost:3030/api/v3/sso/oauth/');
			});
		});
		describe('when getOauthConfig was called before', () => {
			const setup = async () => {
				setupOauthConfigurationReturn();
				await kcIdmOauthService.getOauthConfig();
			};
			it('should return the cached keycloak OAuth static configuration', async () => {
				await setup();
				const clientId = 'TheNewClientId';
				const clientSecret = 'TheNewClientSecret';
				kcAdminServiceMock.getClientId.mockReturnValueOnce(clientId);
				kcAdminServiceMock.getClientSecret.mockResolvedValueOnce(clientSecret);

				const ret = await kcIdmOauthService.getOauthConfig();
				expect(ret.clientId).toBe('TheClientId');
				expect(ret.clientSecret).toBe('TheClientSecret');
			});
		});
	});

	describe('isOauthConfigAvailable', () => {
		describe('when keycloak is available', () => {
			it('should return true', async () => {
				kcAdminServiceMock.testKcConnection.mockResolvedValueOnce(true);
				const ret = await kcIdmOauthService.isOauthConfigAvailable();
				expect(ret).toBe(true);
			});
		});
		describe('when keycloak is not available', () => {
			it('should return false', async () => {
				kcAdminServiceMock.testKcConnection.mockResolvedValueOnce(false);
				const ret = await kcIdmOauthService.isOauthConfigAvailable();
				expect(ret).toBe(false);
			});
		});
		describe('when config was set before', () => {
			it('should return true', async () => {
				setupOauthConfigurationReturn();
				kcAdminServiceMock.testKcConnection.mockResolvedValueOnce(false);
				await kcIdmOauthService.getOauthConfig();
				const ret = await kcIdmOauthService.isOauthConfigAvailable();
				expect(ret).toBe(true);
			});
		});
	});

	describe('resetOauthConfigCache', () => {
		it('invalidates previously set oAuth configuration', async () => {
			kcAdminServiceMock.testKcConnection.mockResolvedValueOnce(true);
			kcAdminServiceMock.testKcConnection.mockResolvedValueOnce(false);
			const ret1 = await kcIdmOauthService.isOauthConfigAvailable();
			kcIdmOauthService.resetOauthConfigCache();
			const ret2 = await kcIdmOauthService.isOauthConfigAvailable();
			expect(ret1).toBe(true);
			expect(ret2).toBe(false);
		});
	});

	describe('resourceOwnerPasswordGrant', () => {
		describe('when entering valid credentials', () => {
			const setup = () => {
				const accessToken = 'accessToken';
				httpServiceMock.request.mockReturnValue(of({ data: { access_token: accessToken } } as AxiosResponse));
				return accessToken;
			};
			it('should return access token', async () => {
				setupOauthConfigurationReturn();
				const accessToken = setup();
				const result = await kcIdmOauthService.resourceOwnerPasswordGrant('username', 'password');
				expect(result).toBe(accessToken);
			});
		});

		describe('when entering invalid credentials', () => {
			const setup = () => {
				httpServiceMock.request.mockImplementation(() => {
					throw new Error();
				});
			};

			it('should return undefined', async () => {
				setupOauthConfigurationReturn();
				setup();
				const result = await kcIdmOauthService.resourceOwnerPasswordGrant('username', 'password');
				expect(result).toBeUndefined();
			});
		});
	});
});
