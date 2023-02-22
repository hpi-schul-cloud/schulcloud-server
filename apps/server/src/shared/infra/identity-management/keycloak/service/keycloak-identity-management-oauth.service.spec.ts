import { createMock, DeepMocked } from '@golevelup/ts-jest';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { KeycloakAdministrationService } from '../../keycloak-management/service/keycloak-administration.service';
import { KeycloakIdentityManagementOauthService } from './keycloak-identity-management-oauth.service';

describe('KeycloakIdentityManagementService', () => {
	let module: TestingModule;
	let kcIdmOauthService: KeycloakIdentityManagementOauthService;
	let kcAdminServiceMock: DeepMocked<KeycloakAdministrationService>;
	let httpServiceMock: DeepMocked<HttpService>;
	let configServiceMock: DeepMocked<ConfigService>;

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

	describe('resourceOwnerPasswordGrant', () => {
		describe('when entering valid credentials', () => {
			const setup = () => {
				configServiceMock.get.mockReturnValue('');
				kcAdminServiceMock.callKcAdminClient.mockResolvedValue({} as KeycloakAdminClient);
				httpServiceMock.get.mockReturnValue(
					of({
						data: {
							issuer: 'issuer',
							tokenEndpoint: 'tokenEndpoint',
							authEndpoint: 'authEndpoint',
							logoutEndpoint: 'logoutEndpoint',
							jwksEndpoint: 'jwksEndpoint',
						},
					} as AxiosResponse)
				);
				const accessToken = 'accessToken';
				httpServiceMock.request.mockReturnValue(of({ data: { access_token: accessToken } } as AxiosResponse));
				return accessToken;
			};

			it('should return access token', async () => {
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
				setup();
				const result = await kcIdmOauthService.resourceOwnerPasswordGrant('username', 'password');
				expect(result).toBeUndefined();
			});
		});
	});
});
