import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HydraSsoService } from '@src/modules/oauth/service/hydra.service';
import { LtiToolRepo } from '@shared/repo';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { OauthConfig } from '@shared/domain';
import { of } from 'rxjs';
import { CookiesDto } from '@src/modules/oauth/service/dto/cookies.dto';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { ObjectId } from '@mikro-orm/mongodb';
import { InternalServerErrorException } from '@nestjs/common';

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
	let service: HydraSsoService;

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
		redirectUri: `${apiHost}/v3/sso/hydra/12345`,
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
				case 'NEXTCLOUD_SCOPES':
					return scopes;
				default:
					throw new Error(`No mock for key '${key}'`);
			}
		});

		module = await Test.createTestingModule({
			controllers: [HydraSsoService],
			providers: [
				{
					provide: LtiToolRepo,
					useValue: createMock<LtiToolRepo>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();

		service = module.get(HydraSsoService);
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
				`http://hydra.mock/oauth2/auth?response_type=code&scope=openid%20uuid&client_id=12345&redirect_uri=localhost%2Fv3%2Fsso%2Fhydra%2F12345&state=mockNanoId`,
				{}
			);
			expect(result.data).toEqual(responseData);
		});
	});

	describe('processRedirect', () => {
		it('should process http request with hydra cookie', async () => {
			// Act
			const result: AxiosResponse = await service.processRedirect(hydraUri, {});

			// Assert
			expect(httpService.get).toHaveBeenCalledWith(hydraUri, {});
			expect(result.data).toEqual(responseData);
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
});
