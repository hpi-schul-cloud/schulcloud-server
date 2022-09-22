import { Test, TestingModule } from '@nestjs/testing';
import { HydraService } from '@shared/infra/oauth-provider/hydra/hydra.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse, Method } from 'axios';
import { of } from 'rxjs';
import { NotImplementedException } from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { RedirectResponse } from '@shared/infra/oauth-provider/dto';

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

	const hydraUri = Configuration.get('HYDRA_URI') as string;

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

	describe('Consent Flow', () => {
		describe('getConsentRequest', () => {
			it('should throw', () => {
				expect(() => service.getConsentRequest('')).toThrow(NotImplementedException);
			});
		});

		describe('acceptConsentRequest', () => {
			it('should throw', () => {
				expect(() => service.acceptConsentRequest('', {})).toThrow(NotImplementedException);
			});
		});

		describe('rejectConsentRequest', () => {
			it('should throw', () => {
				expect(() => service.rejectConsentRequest('', {})).toThrow(NotImplementedException);
			});
		});

		describe('listConsentSessions', () => {
			it('should throw', () => {
				expect(() => service.listConsentSessions('')).toThrow(NotImplementedException);
			});
		});

		describe('revokeConsentSession', () => {
			it('should throw', () => {
				expect(() => service.revokeConsentSession('', '')).toThrow(NotImplementedException);
			});
		});
	});

	describe('Login Flow', () => {
		describe('getLoginRequest', () => {
			it('should throw', () => {
				expect(() => service.getLoginRequest('')).toThrow(NotImplementedException);
			});
		});

		describe('acceptLoginRequest', () => {
			it('should throw', () => {
				expect(() => service.acceptLoginRequest('', { subject: '' })).toThrow(NotImplementedException);
			});
		});

		describe('rejectLoginRequest', () => {
			it('should throw', () => {
				expect(() => service.rejectLoginRequest('', {})).toThrow(NotImplementedException);
			});
		});
	});

	describe('Logout Flow', () => {
		describe('acceptLogoutRequest', () => {
			it('should make http request', async () => {
				// Arrange
				const responseMock: RedirectResponse = { redirect_to: 'redirect_mock' };
				httpService.request.mockReturnValue(of(createAxiosResponse(responseMock)));
				const config: AxiosRequestConfig = {
					method: 'PUT',
					url: `${hydraUri}/oauth2/auth/requests/logout/accept?logout_challenge=challenge_mock`,
					headers: { 'X-Forwarded-Proto': 'https' },
				};

				// Act
				const response: RedirectResponse = await service.acceptLogoutRequest('challenge_mock');

				// Assert
				expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
				expect(response).toEqual(responseMock);
			});
		});
	});

	describe('Client Flow', () => {
		describe('listOAuth2Clients', () => {
			it('should throw', () => {
				expect(() => service.listOAuth2Clients()).toThrow(NotImplementedException);
			});
		});

		describe('getOAuth2Client', () => {
			it('should throw', () => {
				expect(() => service.getOAuth2Client('')).toThrow(NotImplementedException);
			});
		});

		describe('createOAuth2Client', () => {
			it('should throw', () => {
				expect(() => service.createOAuth2Client({})).toThrow(NotImplementedException);
			});
		});

		describe('updateOAuth2Client', () => {
			it('should throw', () => {
				expect(() => service.updateOAuth2Client('', {})).toThrow(NotImplementedException);
			});
		});

		describe('deleteOAuth2Client', () => {
			it('should throw', () => {
				expect(() => service.deleteOAuth2Client('')).toThrow(NotImplementedException);
			});
		});
	});

	describe('introspectOAuth2Token', () => {
		it('should throw', () => {
			expect(() => service.introspectOAuth2Token('', '')).toThrow(NotImplementedException);
		});
	});

	describe('isInstanceAlive', () => {
		it('should throw', () => {
			expect(() => service.isInstanceAlive()).toThrow(NotImplementedException);
		});
	});
});
