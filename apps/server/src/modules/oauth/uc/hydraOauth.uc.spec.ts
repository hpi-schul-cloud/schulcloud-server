import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { Logger } from '@src/core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HydraSsoService } from '@src/modules/oauth/service/hydra.service';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { OauthConfig } from '@shared/domain';
import { AuthorizationParams } from '@src/modules/oauth/controller/dto/authorization.params';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto/oauth-token.response';
import { IJwt } from '@src/modules/oauth/interface/jwt.base.interface';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { CookiesDto } from '../service/dto/cookies.dto';
import { HydraOauthUc } from '.';

class HydraOauthUcSpec extends HydraOauthUc {
	public processCookiesSpec(setCookies: string[], cookies: CookiesDto): void {
		super.processCookies(setCookies, cookies);
	}
}

describe('HydraOauthUc', () => {
	let module: TestingModule;
	let uc: HydraOauthUcSpec;

	let hydraOauthService: DeepMocked<HydraSsoService>;
	let oauthService: DeepMocked<OAuthService>;

	let ltiToolId: string;
	let JWTMock: string;
	let userIdMock: string;
	let oauthClientId: string;
	let hydraOauthConfig: OauthConfig;
	let oauthTokenResponse: OauthTokenResponse;
	let defaultDecodedJWT: IJwt;

	const hydraUri = 'hyraUri';
	const apiHost = 'apiHost';
	const nextcloudScopes = 'nextcloudscope';
	const MAX_REDIRECTS = 1;

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockImplementation((key: string): unknown => {
			switch (key) {
				case 'HYDRA_URI':
					return hydraUri;
				case 'API_HOST':
					return apiHost;
				case 'NEXTCLOUD_SCOPES':
					return nextcloudScopes;
				default:
					return '';
			}
		});

		module = await Test.createTestingModule({
			imports: [HttpModule],
			providers: [
				HydraOauthUcSpec,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: HydraSsoService,
					useValue: createMock<HydraSsoService>(),
				},
				{
					provide: OAuthService,
					useValue: createMock<OAuthService>(),
				},
			],
		}).compile();

		uc = await module.get(HydraOauthUcSpec);
		hydraOauthService = await module.get(HydraSsoService);
		oauthService = await module.get(OAuthService);
	});

	afterAll(async () => {
		jest.clearAllMocks();
		await module.close();
	});

	beforeEach(() => {
		ltiToolId = 'ltiToolIdMock';
		JWTMock = 'jwtMock';
		userIdMock = 'userIdMock';
		oauthClientId = 'oauthClientIdMock';

		hydraOauthConfig = new OauthConfig({
			authEndpoint: `${hydraUri}/oauth2/auth`,
			clientId: 'toolClientId',
			clientSecret: 'toolSecret',
			grantType: 'authorization_code',
			issuer: `${hydraUri}/`,
			jwksEndpoint: `${hydraUri}/.well-known/jwks.json`,
			logoutEndpoint: `${hydraUri}/oauth2/sessions/logout`,
			provider: 'hydra',
			redirectUri: `${Configuration.get('API_HOST') as string}/v3/sso/hydra/${ltiToolId}`,
			responseType: 'code',
			scope: Configuration.get('NEXTCLOUD_SCOPES') as string, // Only Nextcloud is currently supported
			tokenEndpoint: `${hydraUri}/oauth2/token`,
		});

		oauthTokenResponse = {
			access_token: 'accessTockenMock',
			refresh_token: 'refreshTokenMock',
			id_token: 'idTokenMock',
		};

		defaultDecodedJWT = {
			sub: 'subMock',
			uuid: 'uuidMock',
		};
	});

	describe('getOauthToken', () => {
		it('should return the oauth token response', async () => {
			// Arrange
			const code = 'kdjiqwjdjnq';

			hydraOauthService.generateConfig.mockResolvedValue(hydraOauthConfig);
			oauthService.checkAuthorizationCode.mockReturnValue(code);
			oauthService.requestToken.mockResolvedValue(oauthTokenResponse);
			oauthService.validateToken.mockResolvedValue(defaultDecodedJWT);

			// Act
			const oauthToken = await uc.getOauthToken({ code }, '4566456');

			// Assert
			expect(oauthToken).toEqual(oauthTokenResponse);
		});
	});

	describe('requestAuthCode', () => {
		const axiosConfig = {
			headers: {},
			withCredentials: true,
			maxRedirects: 0,
			validateStatus: (status: number) => {
				return status === 200 || status === 302;
			},
		};

		it('should return the authorizationcode', async () => {
			// Arrange
			const expectedAuthParams: AuthorizationParams = {
				code: 'defaultAuthCode',
			};

			const axiosResponse1: AxiosResponse = {
				data: expectedAuthParams,
				status: 302,
				statusText: '',
				headers: {
					location: 'https//mock.url/',
					referer: 'hydra',
				},
				config: axiosConfig,
			};
			axiosResponse1.headers['set-cookie'] = ['oauth2=cookieMock; Secure; HttpOnly'];

			const axiosResponse2: AxiosResponse = {
				data: expectedAuthParams,
				status: 200,
				statusText: '',
				headers: {
					location: '/mock/path',
					referer: 'dbildungscloud',
				},
				config: axiosConfig,
			};
			// axiosResponse2.headers['set-cookie'] = ['foo=bar; Expires=Thu; Secure; HttpOnly'];

			hydraOauthService.generateConfig.mockResolvedValue(hydraOauthConfig);
			hydraOauthService.initAuth.mockResolvedValue(axiosResponse1);

			hydraOauthService.processRedirect.mockResolvedValueOnce(axiosResponse1);
			hydraOauthService.processRedirect.mockResolvedValueOnce(axiosResponse2);

			// Act
			const authParams: AuthorizationParams = await uc.requestAuthCode(userIdMock, JWTMock, oauthClientId);

			// Assert
			expect(authParams).toStrictEqual(expectedAuthParams);
			expect(hydraOauthService.processRedirect).toHaveBeenNthCalledWith(
				1,
				axiosResponse1.headers.location,
				axiosResponse1.headers.referer,
				new CookiesDto({ localCookie: `jwt=${JWTMock}`, hydraCookie: '' }),
				axiosConfig
			);
			expect(hydraOauthService.processRedirect).toHaveBeenNthCalledWith(
				2,
				axiosResponse1.headers.location,
				axiosResponse1.headers.referer,
				new CookiesDto({ localCookie: `jwt=${JWTMock}`, hydraCookie: 'oauth2=cookieMock' }),
				axiosConfig
			);
		});
	});

	describe('processCookies', () => {
		it('should return the oauth token response', () => {
			// Arrange
			const headers = [
				'oauth2_cookie1=cookieMock; Secure; HttpOnly',
				'oauth2_cookie2=cookieMock; Secure',
				'foo1=bar1; Expires:Thu',
				'foo2=bar2; HttpOnly',
			];
			const cookiesDTO = new CookiesDto({ hydraCookie: '', localCookie: '' });

			// Act
			uc.processCookiesSpec(headers, cookiesDTO);

			// Assert
			expect(cookiesDTO.hydraCookie).toEqual([
				'oauth2_cookie1=cookieMock; Secure; HttpOnly',
				'oauth2_cookie2=cookieMock; Secure',
			]);
		});
	});
});
