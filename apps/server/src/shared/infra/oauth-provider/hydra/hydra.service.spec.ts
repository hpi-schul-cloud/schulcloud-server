import { Test, TestingModule } from '@nestjs/testing';
import { HydraService } from '@shared/infra/oauth-provider/hydra/hydra.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse, Method } from 'axios';
import {
	AcceptLoginRequestBody,
	ProviderLoginResponse,
	ProviderRedirectResponse,
	RejectRequestBody,
} from '@shared/infra/oauth-provider/dto';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { of } from 'rxjs';
import resetAllMocks = jest.resetAllMocks;

class HydraServiceSpec extends HydraService {
	public async requestSpec<T>(
		method: Method,
		url: string,
		data?: unknown,
		additionalHeaders: AxiosRequestHeaders = {}
	): Promise<T> {
		return super.request(method, url, data, additionalHeaders);
	}
}

const createAxiosResponse = <T>(data: T): AxiosResponse<T> => ({
	data,
	status: 200,
	statusText: '',
	headers: {},
	config: {},
});

describe('HydraService', () => {
	let module: TestingModule;
	let service: HydraServiceSpec;

	let httpService: DeepMocked<HttpService>;

	const hydraUri = 'http://hydra.uri';

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockReturnValue(hydraUri);

		module = await Test.createTestingModule({
			providers: [
				HydraServiceSpec,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();

		service = module.get(HydraServiceSpec);
		httpService = module.get(HttpService);
	});

	afterAll(async () => {
		await module.close();
		jest.clearAllMocks();
	});

	describe('request', () => {
		it('should return data when called with all parameters', async () => {
			const data: { test: string } = {
				test: 'data',
			};

			httpService.request.mockReturnValue(of(createAxiosResponse(data)));

			const result: { test: string } = await service.requestSpec(
				'GET',
				'testUrl',
				{ dataKey: 'dataValue' },
				{ headerKey: 'headerValue' }
			);

			expect(result).toEqual(data);
			expect(httpService.request).toHaveBeenCalledWith(
				expect.objectContaining({
					url: 'testUrl',
					method: 'GET',
					headers: {
						'X-Forwarded-Proto': 'https',
						headerKey: 'headerValue',
					},
					data: { dataKey: 'dataValue' },
				})
			);
		});

		it('should return data when called with only necessary parameters', async () => {
			const data: { test: string } = {
				test: 'data',
			};

			httpService.request.mockReturnValue(of(createAxiosResponse(data)));

			const result: { test: string } = await service.requestSpec('GET', 'testUrl');

			expect(result).toEqual(data);
			expect(httpService.request).toHaveBeenCalledWith(
				expect.objectContaining({
					url: 'testUrl',
					method: 'GET',
					headers: {
						'X-Forwarded-Proto': 'https',
					},
				})
			);
		});
	});

	describe('Login Flow', () => {
		let challenge: string;
		const providerLoginResponse: ProviderLoginResponse = {
			challenge: 'challenge',
			client: {
				client_id: 'client_id',
				created_at: Date(),
				metadata: {},
			},
			oidc_context: {},
			request_url: 'request_url',
			requested_access_token_audience: ['requested_access_token_audience'],
			requested_scope: ['requested_scope'],
			session_id: 'session_id',
			skip: true,
			subject: 'subject',
		};

		beforeEach(() => {
			challenge = 'challenge';
		});

		afterEach(() => {
			resetAllMocks();
		});
		describe('getLoginRequest', () => {
			it('should make http request', async () => {
				// Arrange
				const config: AxiosRequestConfig = {
					method: 'GET',
					url: `${hydraUri}/oauth2/auth/requests/login?login_challenge=${challenge}`,
				};
				httpService.request.mockReturnValue(
					of(
						createAxiosResponse<ProviderLoginResponse>({
							challenge: 'challenge',
							client: {
								client_id: 'client_id',
								created_at: Date(),
								metadata: {},
							},
							oidc_context: {},
							request_url: 'request_url',
							requested_access_token_audience: ['requested_access_token_audience'],
							requested_scope: ['requested_scope'],
							session_id: 'session_id',
							skip: true,
							subject: 'subject',
						})
					)
				);

				// Act
				const response: ProviderLoginResponse = await service.getLoginRequest(challenge);

				// Assert
				expect(response).toEqual(providerLoginResponse);
				expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
			});
		});

		describe('acceptLoginRequest', () => {
			it('should make http request', async () => {
				const body: AcceptLoginRequestBody = {
					subject: '',
					force_subject_identifier: '',
					remember_for: 0,
					remember: true,
				};
				const config: AxiosRequestConfig = {
					method: 'PUT',
					url: `${hydraUri}/oauth2/auth/requests/login/accept?login_challenge=${challenge}`,
					data: body,
				};
				const expectedRedirectTo = 'redirectTo';
				httpService.request.mockReturnValue(
					of(createAxiosResponse<ProviderRedirectResponse>({ redirect_to: expectedRedirectTo }))
				);

				const result: ProviderRedirectResponse = await service.acceptLoginRequest(challenge, body);

				expect(result.redirect_to).toEqual(expectedRedirectTo);
				expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
			});
		});

		describe('rejectLoginRequest', () => {
			it('should make http request', async () => {
				// Arrange
				const body: RejectRequestBody = {
					error: 'error',
				};
				const config: AxiosRequestConfig = {
					method: 'PUT',
					url: `${hydraUri}/oauth2/auth/requests/login/reject?login_challenge=${challenge}`,
					data: body,
				};
				const expectedRedirectTo = 'redirectTo';
				httpService.request.mockReturnValue(
					of(createAxiosResponse<ProviderRedirectResponse>({ redirect_to: expectedRedirectTo }))
				);

				// Act
				const result: ProviderRedirectResponse = await service.rejectLoginRequest(challenge, body);

				// Assert
				expect(result.redirect_to).toEqual(expectedRedirectTo);
				expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
			});
		});
	});
});
