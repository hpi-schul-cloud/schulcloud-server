import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { KeycloakSystemService } from './keycloak-system.service';
import { KeycloakIdentityManagementOauthService } from './keycloak-identity-management-oauth.service';

describe('KeycloakIdentityManagementService', () => {
	let kcIdmOauthService: KeycloakIdentityManagementOauthService;
	let kcSystemServiceMock: DeepMocked<KeycloakSystemService>;
	let httpServiceMock: DeepMocked<HttpService>;

	beforeAll(() => {
		kcSystemServiceMock = createMock<KeycloakSystemService>();
		httpServiceMock = createMock<HttpService>();
		kcIdmOauthService = new KeycloakIdentityManagementOauthService(kcSystemServiceMock, httpServiceMock);
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
