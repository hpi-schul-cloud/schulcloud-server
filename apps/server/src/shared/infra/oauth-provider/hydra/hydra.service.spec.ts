import { Test, TestingModule } from '@nestjs/testing';
import { HydraService } from '@shared/infra/oauth-provider/hydra/hydra.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestHeaders, AxiosResponse, Method } from 'axios';
import { of } from 'rxjs';

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

	beforeAll(async () => {
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
});
