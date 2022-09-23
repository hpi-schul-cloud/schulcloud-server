import { Test, TestingModule } from '@nestjs/testing';
import { HydraService } from '@shared/infra/oauth-provider/hydra/hydra.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestHeaders, AxiosResponse, Method } from 'axios';
import { of } from 'rxjs';
import { IntrospectResponse } from '@shared/infra/oauth-provider/dto/index';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ProviderConsentSessionResponse } from '@shared/infra/oauth-provider/dto/response/provider-consent-session.response';

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

	describe('Consent Flow', () => {
		describe('listConsentSessions', () => {
			it('should list all consent sessions', async () => {
				const response: ProviderConsentSessionResponse[] = [{ consent_request: { challenge: 'challenge' } }];
				httpService.request.mockReturnValue(of(createAxiosResponse(response)));

				const result: ProviderConsentSessionResponse[] = await service.listConsentSessions('userId');

				expect(result).toEqual(response);
				expect(httpService.request).toHaveBeenCalledWith(
					expect.objectContaining({
						url: `${hydraUri}/oauth2/auth/sessions/consent?subject=userId`,
						method: 'GET',
						headers: {
							'X-Forwarded-Proto': 'https',
						},
					})
				);
			});
		});

		describe('revokeConsentSession', () => {
			it('should revoke all consent sessions', async () => {
				httpService.request.mockReturnValue(of(createAxiosResponse({})));

				await service.revokeConsentSession('userId', 'clientId');

				expect(httpService.request).toHaveBeenCalledWith(
					expect.objectContaining({
						url: `${hydraUri}/oauth2/auth/sessions/consent?subject=userId&client=clientId`,
						method: 'DELETE',
						headers: {
							'X-Forwarded-Proto': 'https',
						},
					})
				);
			});
		});
	});

	describe('Miscellaneous', () => {
		describe('introspectOAuth2Token', () => {
			it('should return introspect', async () => {
				const response: IntrospectResponse = {
					active: true,
				};
				httpService.request.mockReturnValue(of(createAxiosResponse(response)));

				const result: IntrospectResponse = await service.introspectOAuth2Token('token', 'scope');

				expect(result).toEqual(response);
				expect(httpService.request).toHaveBeenCalledWith(
					expect.objectContaining({
						url: `${hydraUri}/oauth2/introspect`,
						method: 'POST',
						headers: {
							'X-Forwarded-Proto': 'https',
							'Content-Type': 'application/x-www-form-urlencoded',
						},
						data: 'token=token&scope=scope',
					})
				);
			});
		});

		describe('isInstanceAlive', () => {
			it('should check if hydra is alive', async () => {
				httpService.request.mockReturnValue(of(createAxiosResponse(true)));

				const result: boolean = await service.isInstanceAlive();

				expect(result).toEqual(true);
				expect(httpService.request).toHaveBeenCalledWith(
					expect.objectContaining({
						url: `${hydraUri}/health/alive`,
						method: 'GET',
						headers: {
							'X-Forwarded-Proto': 'https',
						},
					})
				);
			});
		});
	});
});
