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
import { AxiosResponse } from 'axios';
import { InternalServerErrorException } from '@nestjs/common';
import { CookiesDto } from '../service/dto/cookies.dto';
import { HydraOauthUc } from '.';

class HydraOauthUcSpec extends HydraOauthUc {
	public processCookiesSpec(setCookies: string[], cookie: CookiesDto): CookiesDto {
		return super.processCookies(setCookies, cookie);
	}

	public validateStatusSpec = (status: number) => {
		return this.validateStatus(status);
	};
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

	const hydraUri = 'hydraUri';
	const apiHost = 'apiHost';
	const nextcloudScopes = 'nextcloudscope';

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockImplementation((key: string): unknown => {
			switch (key) {
				case 'HYDRA_PUBLIC_URI':
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
			const code = 'kdjiqwjdjnq';

			hydraOauthService.generateConfig.mockResolvedValue(hydraOauthConfig);
			oauthService.checkAuthorizationCode.mockReturnValue(code);
			oauthService.requestToken.mockResolvedValue(oauthTokenResponse);
			oauthService.validateToken.mockResolvedValue(defaultDecodedJWT);

			const oauthToken = await uc.getOauthToken({ code }, '4566456');

			expect(oauthToken).toEqual(oauthTokenResponse);
		});
	});

	describe('requestAuthCode', () => {
		it('should return the authorizationcode', async () => {
			const expectedAuthParams: AuthorizationParams = {
				code: 'defaultAuthCode',
			};
			const axiosConfig = {
				headers: {},
				withCredentials: true,
				maxRedirects: 0,
				// untestable
				validateStatus: jest.fn().mockImplementationOnce(() => {
					return true;
				}),
			};

			const axiosResponse1: AxiosResponse = {
				data: expectedAuthParams,
				status: 302,
				statusText: '',
				headers: {
					location: Configuration.get('HYDRA_PUBLIC_URI') as string,
					Referer: 'hydra',
				},
				config: axiosConfig,
			};

			const axiosResponse2: AxiosResponse = {
				data: expectedAuthParams,
				status: 200,
				statusText: '',
				headers: {
					location: Configuration.get('HYDRA_PUBLIC_URI') as string,
					Referer: 'hydra',
				},
				config: axiosConfig,
			};

			hydraOauthService.generateConfig.mockResolvedValue(hydraOauthConfig);
			hydraOauthService.initAuth.mockResolvedValue(axiosResponse1);
			axiosResponse1.headers['set-cookie'] = ['oauth2=cookieMock; Referer=hydraUri; Secure; HttpOnly'];
			/*			axiosResponse1.config.headers = {
				Cookie: 'oauth2=cookieMock; Referer=hydraUri; Secure; HttpOnly',
				referer: Configuration.get('HYDRA_URI') as string,
			}; */
			axiosResponse2.config.headers = {
				Cookie: 'oauth2=cookieMock',
				Referer: Configuration.get('HYDRA_PUBLIC_URI') as string,
			};
			hydraOauthService.processRedirect.mockResolvedValueOnce(axiosResponse1);
			hydraOauthService.processRedirect.mockResolvedValueOnce(axiosResponse2);

			const authParams: AuthorizationParams = await uc.requestAuthCode(userIdMock, JWTMock, oauthClientId);

			expect(authParams).toStrictEqual(expectedAuthParams);
			expect(hydraOauthService.processRedirect).toBeCalledTimes(2);
		});
		it('should return the authorizationcode', async () => {
			const expectedAuthParams: AuthorizationParams = {
				code: 'defaultAuthCode',
			};

			const axiosConfig2 = {
				headers: {},
				withCredentials: true,
				maxRedirects: 0,
				validateStatus: jest.fn().mockImplementationOnce(() => {
					return true;
				}),
			};

			const axiosResponse2: AxiosResponse = {
				data: expectedAuthParams,
				status: 200,
				statusText: '',
				headers: {
					location: '/mock/path',
					Referer: 'dbildungscloud',
				},
				config: axiosConfig2,
			};
			axiosResponse2.headers['set-cookie'] = ['foo=bar; Expires=Thu; Secure; HttpOnly'];

			hydraOauthService.generateConfig.mockResolvedValue(hydraOauthConfig);
			hydraOauthService.initAuth.mockResolvedValue(axiosResponse2);

			axiosResponse2.config.headers = {
				Cookie: 'foo=bar; Expires=Thu; Secure; HttpOnly',
				Referer: '',
			};
			hydraOauthService.processRedirect.mockResolvedValueOnce(axiosResponse2);

			const authParams: AuthorizationParams = await uc.requestAuthCode(userIdMock, JWTMock, oauthClientId);

			expect(authParams).toEqual(expectedAuthParams);
			expect(hydraOauthService.processRedirect).toHaveBeenCalledWith(axiosResponse2.headers.location, axiosConfig2);
		});
		it('should throw InternalServerErrorException', async () => {
			const expectedAuthParams: AuthorizationParams = {
				code: 'defaultAuthCode',
			};
			const axiosConfig = {
				headers: {},
				withCredentials: true,
				maxRedirects: 0,
				validateStatus: jest.fn().mockImplementationOnce(() => {
					return true;
				}),
			};

			const axiosResponse1: AxiosResponse = {
				data: expectedAuthParams,
				status: 302,
				statusText: '',
				headers: {
					location: Configuration.get('HYDRA_PUBLIC_URI') as string,
					Referer: 'hydra',
				},
				config: axiosConfig,
			};

			hydraOauthService.generateConfig.mockResolvedValue(hydraOauthConfig);
			hydraOauthService.initAuth.mockResolvedValue(axiosResponse1);
			axiosResponse1.headers['set-cookie'] = ['oauth2=cookieMock; Referer=hydraUri; Secure; HttpOnly'];
			hydraOauthService.processRedirect.mockResolvedValue(axiosResponse1);

			await expect(uc.requestAuthCode(userIdMock, JWTMock, oauthClientId)).rejects.toThrow(
				InternalServerErrorException
			);
		});
	});

	describe('processCookies', () => {
		it('should return the oauth token response', () => {
			const cookie: CookiesDto = new CookiesDto({ hydraCookies: [], localCookies: [] });

			const expectCookie: CookiesDto = new CookiesDto({
				hydraCookies: ['oauth2_cookie1=cookieMock', 'oauth2_cookie2=cookieMock'],
				localCookies: ['foo1=bar1', 'foo2=bar2'],
			});

			const headers = [
				'oauth2_cookie1=cookieMock; Secure; HttpOnly',
				'oauth2_cookie2=cookieMock; Secure',
				'foo1=bar1; Expires:Thu',
				'foo2=bar2; HttpOnly',
			];

			const cookies: CookiesDto = uc.processCookiesSpec(headers, cookie);

			expect(cookies).toEqual(expectCookie);
		});
	});

	describe('validateStatus', () => {
		it('should return true for 302', () => {
			const ret: boolean = uc.validateStatusSpec(302);

			expect(ret).toEqual(true);
		});
		it('should return true for 200', () => {
			const ret: boolean = uc.validateStatusSpec(200);

			expect(ret).toEqual(true);
		});
		it('should return false for 400', () => {
			const ret: boolean = uc.validateStatusSpec(400);

			expect(ret).toEqual(false);
		});
	});
});
