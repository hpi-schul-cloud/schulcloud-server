import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { HttpModule } from '@nestjs/axios';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OauthConfig } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { AuthorizationParams } from '@src/modules/oauth/controller/dto/authorization.params';
import { IJwt } from '@src/modules/oauth/interface/jwt.base.interface';
import { HydraRedirectDto } from '@src/modules/oauth/service/dto/hydra.redirect.dto';
import { HydraSsoService } from '@src/modules/oauth/service/hydra.service';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { HydraOauthUc } from '.';
import { OauthTokenResponse } from '../service/dto/oauth-token.response';

class HydraOauthUcSpec extends HydraOauthUc {
	public validateStatusSpec = (status: number) => this.validateStatus(status);
}

describe('HydraOauthUc', () => {
	let module: TestingModule;
	let uc: HydraOauthUcSpec;

	let hydraOauthService: DeepMocked<HydraSsoService>;
	let oauthService: DeepMocked<OAuthService>;
	const oauthTokenResponse: OauthTokenResponse = {
		access_token: 'accessTockenMock',
		refresh_token: 'refreshTokenMock',
		id_token: 'idTokenMock',
	};
	const defaultDecodedJWT: IJwt = {
		sub: 'subMock',
	};

	const JWTMock = 'jwtMock';
	const userIdMock = 'userIdMock';
	const oauthClientId = 'oauthClientIdMock';
	const hydraUri = 'hydraUri';
	const apiHost = 'apiHost';
	const nextcloudScopes = 'nextcloudscope';
	const hydraOauthConfig = new OauthConfig({
		authEndpoint: `${hydraUri}/oauth2/auth`,
		clientId: 'toolClientId',
		clientSecret: 'toolSecret',
		grantType: 'authorization_code',
		issuer: `${hydraUri}/`,
		jwksEndpoint: `${hydraUri}/.well-known/jwks.json`,
		logoutEndpoint: `${hydraUri}/oauth2/sessions/logout`,
		provider: 'hydra',
		redirectUri: `${apiHost}/v3/sso/hydra/ltiToolIdMock`,
		responseType: 'code',
		scope: 'openid offline others',
		tokenEndpoint: `${hydraUri}/oauth2/token`,
	});

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockImplementation((key: string): unknown => {
			switch (key) {
				case 'HYDRA_PUBLIC_URI':
					return hydraUri;
				case 'HOST':
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
		let expectedAuthParams: AuthorizationParams;
		let axiosConfig: AxiosRequestConfig;
		let axiosResponse1: AxiosResponse;
		let axiosResponse2: AxiosResponse;
		let responseDto1: HydraRedirectDto;
		let responseDto2: HydraRedirectDto;

		beforeAll(() => {
			expectedAuthParams = {
				code: 'defaultAuthCode',
			};
			axiosConfig = {
				headers: {},
				withCredentials: true,
				maxRedirects: 0,
				validateStatus: jest.fn().mockImplementationOnce(() => true),
			};
			axiosResponse1 = {
				data: expectedAuthParams,
				status: 302,
				statusText: '',
				headers: {
					location: '/some/where',
					Referer: 'hydra',
				},
				config: axiosConfig,
			};
			axiosResponse2 = {
				data: expectedAuthParams,
				status: 200,
				statusText: '',
				headers: {
					location: Configuration.get('HYDRA_PUBLIC_URI') as string,
					Referer: 'hydra',
				},
				config: axiosConfig,
			};
			responseDto1 = {
				axiosConfig,
				cookies: { localCookies: [], hydraCookies: [] },
				currentRedirect: 0,
				referer: '',
				response: axiosResponse1,
			};
			responseDto2 = {
				axiosConfig,
				cookies: { localCookies: [], hydraCookies: [] },
				currentRedirect: 0,
				referer: '',
				response: axiosResponse2,
			};
		});

		it('should return the authorizationcode', async () => {
			hydraOauthService.generateConfig.mockResolvedValue(hydraOauthConfig);
			hydraOauthService.initAuth.mockResolvedValue(axiosResponse1);
			hydraOauthService.processRedirect.mockResolvedValueOnce(responseDto1);
			hydraOauthService.processRedirect.mockResolvedValueOnce(responseDto2);

			const authParams: AuthorizationParams = await uc.requestAuthCode(userIdMock, JWTMock, oauthClientId);

			expect(authParams).toStrictEqual(expectedAuthParams);
			expect(hydraOauthService.processRedirect).toBeCalledTimes(2);
		});
		it('should throw InternalServerErrorException', async () => {
			hydraOauthService.generateConfig.mockResolvedValue(hydraOauthConfig);
			hydraOauthService.initAuth.mockResolvedValue(axiosResponse1);
			hydraOauthService.processRedirect.mockImplementation((dto) => {
				dto.currentRedirect += 1;
				return Promise.resolve(dto);
			});

			await expect(uc.requestAuthCode(userIdMock, JWTMock, oauthClientId)).rejects.toThrow(
				InternalServerErrorException
			);
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
