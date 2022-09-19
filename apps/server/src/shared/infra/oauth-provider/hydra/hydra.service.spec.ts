import { Test, TestingModule } from '@nestjs/testing';
import { HydraService } from '@shared/infra/oauth-provider/hydra/hydra.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { of } from 'rxjs';
import { AcceptConsentRequestBody, RejectRequestBody } from '@shared/infra/oauth-provider/dto';
import resetAllMocks = jest.resetAllMocks;

describe('HydraService', () => {
	let module: TestingModule;
	let service: HydraService;
	let httpService: DeepMocked<HttpService>;
	const hydraUri = Configuration.get('HYDRA_URI') as string;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				HydraService,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();

		service = module.get(HydraService);
		httpService = module.get(HttpService);
	});

	afterAll(async () => {
		await module.close();
	});

	// TODO remove after implementation
	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('consent', () => {
		let challenge: string;

		beforeEach(() => {
			challenge = 'challengexyz';
			httpService.request.mockReturnValue(
				of({
					data: '',
					status: 0,
					statusText: '',
					headers: {},
					config: {},
				})
			);
		});

		afterEach(() => {
			resetAllMocks();
		});

		it('getConsentRequest: should make http request', async () => {
			// Arrange
			const config: AxiosRequestConfig = {
				method: 'GET',
				url: `${hydraUri}/oauth2/auth/requests/consent?consent_challenge=${challenge}`,
			};

			// Act
			await service.getConsentRequest(challenge);

			// Assert
			expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
		});

		it('acceptConsentRequest: should make http request', async () => {
			// Arrange
			const body: AcceptConsentRequestBody = {
				grant_scope: ['offline', 'openid'],
			};
			const config: AxiosRequestConfig = {
				method: 'PUT',
				url: `${hydraUri}/oauth2/auth/requests/consent/accept?consent_challenge=${challenge}`,
				data: body,
			};

			// Act
			await service.acceptConsentRequest(challenge, body);

			// Assert
			expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
		});

		it('rejectConsentRequest: should make http request', async () => {
			// Arrange
			const body: RejectRequestBody = {
				error: 'error',
			};
			const config: AxiosRequestConfig = {
				method: 'PUT',
				url: `${hydraUri}/oauth2/auth/requests/consent/reject?consent_challenge=${challenge}`,
				data: body,
			};

			// Act
			await service.rejectConsentRequest(challenge, body);

			// Assert
			expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
		});
	});
});
