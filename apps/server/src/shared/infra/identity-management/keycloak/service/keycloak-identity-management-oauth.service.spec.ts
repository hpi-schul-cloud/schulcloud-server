import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { KeycloakIdentityManagementOauthService } from './keycloak-identity-management-oauth.service';

describe('KeycloakIdentityManagementService', () => {
	let module: TestingModule;
	let kcIdmOauthService: KeycloakIdentityManagementOauthService;
	let httpServiceMock: DeepMocked<HttpService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();
		kcIdmOauthService = module.get(KeycloakIdentityManagementOauthService);
		httpServiceMock = module.get(HttpService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('resourceOwnerPasswordGrant', () => {
		describe('when entering valid credentials', () => {
			const setup = () => {
				const accessToken = 'accessToken';
				httpServiceMock.request.mockReturnValueOnce(of({ data: { access_token: accessToken } } as AxiosResponse));
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
				httpServiceMock.request.mockImplementationOnce(() => {
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
