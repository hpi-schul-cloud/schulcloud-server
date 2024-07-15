import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, EncryptionService, SymetricKeyEncryptionService } from '@infra/encryption';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { Logger } from '@src/core/logger';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';
import { KeycloakIdentityManagementOauthService } from './keycloak-identity-management-oauth.service';

describe('KeycloakIdentityManagementService', () => {
	let module: TestingModule;
	let kcIdmOauthService: KeycloakIdentityManagementOauthService;
	let kcAdminServiceMock: DeepMocked<KeycloakAdministrationService>;
	let httpServiceMock: DeepMocked<HttpService>;
	let oAuthEncryptionService: DeepMocked<SymetricKeyEncryptionService>;

	const clientId = 'TheClientId';
	const clientSecret = 'TheClientSecret';

	beforeAll(async () => {
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
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();
		oAuthEncryptionService = module.get(DefaultEncryptionService);
		kcIdmOauthService = module.get(KeycloakIdentityManagementOauthService);
		kcAdminServiceMock = module.get(KeycloakAdministrationService);
		httpServiceMock = module.get(HttpService);
	});

	afterEach(() => {
		kcIdmOauthService.resetOauthConfigCache();
		jest.resetAllMocks();
	});

	const setupOauthConfigurationReturn = () => {
		oAuthEncryptionService.encrypt.mockImplementation((value: string) => `${value}_enc`);
		oAuthEncryptionService.decrypt.mockImplementation((value: string) => value.substring(0, -4));
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

			it('should return the keycloak OAuth clientId encrypted', async () => {
				setupOauthConfigurationReturn();

				const ret = await kcIdmOauthService.getOauthConfig();

				expect(ret.clientId).toBe(clientId);
			});

			it('should return the keycloak OAuth clientSecret encrypted', async () => {
				setupOauthConfigurationReturn();

				const ret = await kcIdmOauthService.getOauthConfig();

				expect(ret.clientSecret).toBe(`${clientSecret}_enc`);
			});

			it('should return the keycloak OAuth redirect URI for the given domain', async () => {
				setupOauthConfigurationReturn();

				const ret = await kcIdmOauthService.getOauthConfig();

				expect(ret.redirectUri).toBe('');
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
				setupOauthConfigurationReturn();
			};

			it('should return the keycloak OAuth redirect URL for local development', async () => {
				setup();

				const ret = await kcIdmOauthService.getOauthConfig();

				expect(ret.redirectUri).toBe('');
			});
		});

		describe('when getOauthConfig was called before', () => {
			const setup = async () => {
				setupOauthConfigurationReturn();
				await kcIdmOauthService.getOauthConfig();
			};

			it('should return the cached keycloak OAuth static configuration', async () => {
				await setup();
				const clientIdNew = 'TheNewClientId';
				const clientSecretNew = 'TheNewClientSecret';
				kcAdminServiceMock.getClientId.mockReturnValueOnce(clientIdNew);
				kcAdminServiceMock.getClientSecret.mockResolvedValueOnce(clientSecretNew);

				const ret = await kcIdmOauthService.getOauthConfig();

				expect(ret.clientId).toContain(clientId);
				expect(ret.clientSecret).toContain(clientSecret);
				expect(ret.clientId).not.toContain(clientIdNew);
				expect(ret.clientSecret).not.toContain(clientSecretNew);
			});
		});
	});

	describe('isOauthConfigAvailable', () => {
		const setup = (testKcConnection: boolean) => {
			kcAdminServiceMock.testKcConnection.mockResolvedValueOnce(testKcConnection);
		};

		describe('when keycloak is available', () => {
			it('should return true', async () => {
				setup(true);

				const ret = await kcIdmOauthService.isOauthConfigAvailable();

				expect(ret).toBe(true);
			});
		});

		describe('when keycloak is not available', () => {
			it('should return false', async () => {
				setup(false);

				const ret = await kcIdmOauthService.isOauthConfigAvailable();

				expect(ret).toBe(false);
			});
		});

		describe('when config was set before', () => {
			it('should return true', async () => {
				setup(false);
				setupOauthConfigurationReturn();

				await kcIdmOauthService.getOauthConfig();
				const ret = await kcIdmOauthService.isOauthConfigAvailable();

				expect(ret).toBe(true);
			});
		});
	});

	describe('resetOauthConfigCache', () => {
		const setup = () => {
			kcAdminServiceMock.testKcConnection.mockResolvedValueOnce(true);
			kcAdminServiceMock.testKcConnection.mockResolvedValueOnce(false);
		};

		it('invalidates previously set oAuth configuration', async () => {
			setup();

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
