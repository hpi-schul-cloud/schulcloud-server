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

describe('HydraOauthUc', () => {
	let service: HydraOauthUc;
	let hydraOauthService: DeepMocked<HydraSsoService>;
	let oauthService: DeepMocked<OAuthService>;
	let defaultAuthCode: string;
	let defaultQuery: AuthorizationParams;
	let ltiToolId: string;
	let JWTMock: string;
	let userIdMock: string;
	let oauthClientId: string;
	let cookieDTO: CookiesDto;
	let hydraOauthConfig: OauthConfig;
	let oauthTokenResponse: OauthTokenResponse;
	let defaultDecodedJWT: IJwt;
	let axiosConfig: AxiosRequestConfig;
	let axiosResponse: AxiosResponse;

	const hydraUri = 'hyraUri';
	const apiHost = 'apiHost';
	const nextcloudScopes = 'nextcloudscope';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [HttpModule],
			providers: [
				HydraOauthUc,
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

		service = await module.get(HydraOauthUc);
		hydraOauthService = await module.get(HydraSsoService);
		oauthService = await module.get(OAuthService);
	});

	beforeEach(() => {
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
		defaultAuthCode = '43534543jnj543342jn2';
		defaultQuery = { code: defaultAuthCode };
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

		axiosConfig = {
			headers: {},
			withCredentials: true,
			maxRedirects: 0,
			validateStatus: (status: number) => {
				return status === 200 || status === 302;
			},
		};

		axiosResponse = {
			data: { url: 'urlMock' },
			status: 0,
			statusText: '',
			headers: {},
			config: axiosConfig,
		};
	});
	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getOauthToken', () => {
		it('should return the oauth token response', async () => {
			// Arrange
			hydraOauthService.generateConfig.mockResolvedValue(hydraOauthConfig);
			oauthService.checkAuthorizationCode.mockReturnValue(defaultAuthCode);
			oauthService.requestToken.mockResolvedValue(oauthTokenResponse);
			oauthService.validateToken.mockResolvedValue(defaultDecodedJWT);
			// Act
			const oauthToken = await service.getOauthToken(defaultQuery, '4566456');
			// Assert
			expect(oauthToken).toEqual(oauthTokenResponse);
		});
	});

	describe('requestAuthCode', () => {
		it('should return the authorizationcode', async () => {
			// Arrange
			hydraOauthService.generateConfig.mockResolvedValue(hydraOauthConfig);
			jest.mock('../service/dto/cookies.dto.ts', () => {
				return new CookiesDto({
					localCookie: `jwt=${JWTMock}`,
					hydraCookie: 'oauth2_blabla=kjasndlijashflkjsabsflöij; oauth2_blabla2=asdasdasd',
				});
			});
			hydraOauthService.initAuth.mockResolvedValue(axiosResponse);
			axiosResponse.headers['set-cookie']?.push();
			// Act
			const authParams = await service.requestAuthCode(userIdMock, JWTMock, oauthClientId);
			// Assert
			expect(authParams).toEqual(oauthTokenResponse);
		});
	});
});
