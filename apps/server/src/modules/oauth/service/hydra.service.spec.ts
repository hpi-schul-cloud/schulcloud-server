import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HydraSsoService } from '@src/modules/oauth/service/hydra.service';
import { LtiToolRepo } from '@shared/repo';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { OauthConfig } from '@shared/domain';
import { of } from 'rxjs';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { ObjectId } from '@mikro-orm/mongodb';
import { InternalServerErrorException } from '@nestjs/common';
import { CookiesDto } from '@src/modules/oauth/service/dto/cookies.dto';
import { AuthorizationParams } from '@src/modules/oauth/controller/dto';
import { HydraRedirectDto } from '@src/modules/oauth/service/dto/hydra.redirect.dto';
import { DefaultEncryptionService, SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { Logger } from '@src/core/logger';

class HydraOauthSsoSpec extends HydraSsoService {
	public processCookiesSpec(setCookies: string[], cookie: CookiesDto): CookiesDto {
		return super.processCookies(setCookies, cookie);
	}
}

jest.mock('nanoid', () => {
	return {
		nanoid: jest.fn(() => 'mockNanoId'),
	};
});

const createAxiosResponse = <T = unknown>(data: T): AxiosResponse<T> => ({
	data,
	status: 0,
	statusText: '',
	headers: {},
	config: {},
});

describe('HydraService', () => {
	let module: TestingModule;
	let service: HydraOauthSsoSpec;

	let ltiToolRepo: DeepMocked<LtiToolRepo>;
	let httpService: DeepMocked<HttpService>;

	const responseData = {};

	const hydraUri = 'http://hydra.mock';
	const scopes = 'openid uuid';
	const apiHost = 'localhost';

	const oauthConfig: OauthConfig = new OauthConfig({
		clientId: '12345',
		clientSecret: 'mocksecret',
		tokenEndpoint: `${hydraUri}/oauth2/token`,
		grantType: 'authorization_code',
		redirectUri: `${apiHost}/api/v3/sso/hydra/12345`,
		scope: scopes,
		responseType: 'code',
		authEndpoint: `${hydraUri}/oauth2/auth`,
		provider: 'hydra',
		logoutEndpoint: `${hydraUri}/oauth2/sessions/logout`,
		issuer: `${hydraUri}/`,
		jwksEndpoint: `${hydraUri}/.well-known/jwks.json`,
	});

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockImplementation((key: string): unknown => {
			switch (key) {
				case 'HYDRA_PUBLIC_URI':
					return hydraUri;
				case 'API_HOST':
					return apiHost;
				case 'HOST':
					return apiHost;
				case 'NEXTCLOUD_SCOPES':
					return scopes;
				default:
					throw new Error(`No mock for key '${key}'`);
			}
		});

		module = await Test.createTestingModule({
			providers: [
				HydraOauthSsoSpec,
				{
					provide: LtiToolRepo,
					useValue: createMock<LtiToolRepo>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<SymetricKeyEncryptionService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(HydraOauthSsoSpec);
		ltiToolRepo = module.get(LtiToolRepo);
		httpService = module.get(HttpService);
		httpService.get.mockReturnValue(of(createAxiosResponse(responseData)));
	});

	afterAll(async () => {
		jest.clearAllMocks();
		await module.close();
	});

	describe('initAuth', () => {
		it('should process the initial http request', async () => {
			// Act
			const result: AxiosResponse = await service.initAuth(oauthConfig, {});

			// Assert
			expect(httpService.get).toHaveBeenCalledWith(
				`http://hydra.mock/oauth2/auth?response_type=code&scope=openid%20uuid&client_id=12345&redirect_uri=localhost%2Fapi%2Fv3%2Fsso%2Fhydra%2F12345&state=mockNanoId`,
				{}
			);
			expect(result.data).toEqual(responseData);
		});
	});

	describe('processRedirect', () => {
		const expectedAuthParams: AuthorizationParams = {
			code: 'defaultAuthCode',
		};
		const axiosConfig: AxiosRequestConfig = {
			headers: {},
			withCredentials: true,
			maxRedirects: 0,
			validateStatus: jest.fn().mockImplementationOnce(() => {
				return true;
			}),
		};
		let axiosResponse1: AxiosResponse;
		let axiosResponse2: AxiosResponse;
		let responseDto1: HydraRedirectDto;
		let responseDto2: HydraRedirectDto;

		it('should process a local request', async () => {
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
			responseDto1 = {
				axiosConfig,
				cookies: { localCookies: [], hydraCookies: [] },
				currentRedirect: 0,
				referer: '',
				response: axiosResponse1,
			};

			axiosResponse1.headers['set-cookie'] = ['oauth2=cookieMock; Referer=hydraUri; Secure; HttpOnly'];
			httpService.get.mockReturnValue(of(axiosResponse1));
			// Act
			const resDto: HydraRedirectDto = await service.processRedirect(responseDto1);

			// Assert
			expect(httpService.get).toHaveBeenCalledWith(`${apiHost}${axiosResponse1.headers.location}`, axiosConfig);
			expect(resDto.response.data).toEqual(expectedAuthParams);
		});
		it('should process a hydra request', async () => {
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
			responseDto2 = {
				axiosConfig,
				cookies: { localCookies: [], hydraCookies: [] },
				currentRedirect: 0,
				referer: '',
				response: axiosResponse2,
			};
			axiosResponse2.headers['set-cookie'] = ['foo=bar; Expires=Thu; Secure; HttpOnly'];
			httpService.get.mockReturnValue(of(axiosResponse2));
			// Act
			const resDto: HydraRedirectDto = await service.processRedirect(responseDto2);

			// Assert
			expect(httpService.get).toHaveBeenCalledWith(`${axiosResponse2.headers.location}`, axiosConfig);
			expect(resDto.response.data).toEqual(expectedAuthParams);
		});
	});

	describe('generateConfig', () => {
		it('should throw if oauth fields on lti tool are not set', async () => {
			// Arrange
			ltiToolRepo.findByOauthClientId.mockResolvedValue(
				new LtiToolDO({
					id: new ObjectId().toHexString(),
					name: 'ToolName',
				})
			);

			// Act & Assert
			await expect(service.generateConfig(oauthConfig.clientId)).rejects.toThrow(InternalServerErrorException);
		});

		it('should generate hydra oauth config', async () => {
			// Arrange
			ltiToolRepo.findByOauthClientId.mockResolvedValue(
				new LtiToolDO({
					id: new ObjectId().toHexString(),
					name: 'ToolName',
					oAuthClientId: oauthConfig.clientId,
					secret: oauthConfig.clientSecret,
				})
			);

			// Act
			const result: OauthConfig = await service.generateConfig(oauthConfig.clientId);

			// Assert
			expect(result).toEqual(oauthConfig);
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

			const cookies: CookiesDto = service.processCookiesSpec(headers, cookie);

			expect(cookies).toEqual(expectCookie);
		});
	});
});
