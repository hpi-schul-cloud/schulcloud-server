import { Test, TestingModule } from '@nestjs/testing';
import { HydraService } from '@shared/infra/oauth-provider/hydra/hydra.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse, Method } from 'axios';
import { NotImplementedException } from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { of } from 'rxjs';
import {
	AcceptConsentRequestBody,
	ConsentResponse,
	ProviderRedirectResponse,
	RejectRequestBody,
} from '@shared/infra/oauth-provider/dto';
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
		let challenge: string;

		beforeEach(() => {
			challenge = 'challengexyz';
		});

		afterEach(() => {
			resetAllMocks();
		});

		describe('getConsentRequest', () => {
			it('should make http request', async () => {
				// Arrange
				const config: AxiosRequestConfig = {
					method: 'GET',
					url: `${hydraUri}/oauth2/auth/requests/consent?consent_challenge=${challenge}`,
				};
				httpService.request.mockReturnValue(of(createAxiosResponse<ConsentResponse>({ challenge })));

				// Act
				const result: ConsentResponse = await service.getConsentRequest(challenge);

				// Assert
				expect(result.challenge).toEqual(challenge);
				expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
			});
		});

		describe('acceptConsentRequest', () => {
			it('should make http request', async () => {
				// Arrange
				const body: AcceptConsentRequestBody = {
					grant_scope: ['offline', 'openid'],
				};
				const config: AxiosRequestConfig = {
					method: 'PUT',
					url: `${hydraUri}/oauth2/auth/requests/consent/accept?consent_challenge=${challenge}`,
					data: body,
				};
				const expectedRedirectTo = 'redirectTo';
				httpService.request.mockReturnValue(
					of(createAxiosResponse<ProviderRedirectResponse>({ redirect_to: expectedRedirectTo }))
				);

				// Act
				const result: ProviderRedirectResponse = await service.acceptConsentRequest(challenge, body);

				// Assert
				expect(result.redirect_to).toEqual(expectedRedirectTo);
				expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
			});
		});

		describe('rejectConsentRequest', () => {
			it('should make http request', async () => {
				// Arrange
				const body: RejectRequestBody = {
					error: 'error',
				};
				const config: AxiosRequestConfig = {
					method: 'PUT',
					url: `${hydraUri}/oauth2/auth/requests/consent/reject?consent_challenge=${challenge}`,
					data: body,
				};
				const expectedRedirectTo = 'redirectTo';
				httpService.request.mockReturnValue(
					of(createAxiosResponse<ProviderRedirectResponse>({ redirect_to: expectedRedirectTo }))
				);

				// Act
				const result: ProviderRedirectResponse = await service.rejectConsentRequest(challenge, body);

				// Assert
				expect(result.redirect_to).toEqual(expectedRedirectTo);
				expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
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
				const responseMock: ProviderRedirectResponse = { redirect_to: 'redirect_mock' };
				httpService.request.mockReturnValue(of(createAxiosResponse(responseMock)));
				const config: AxiosRequestConfig = {
					method: 'PUT',
					url: `${hydraUri}/oauth2/auth/requests/logout/accept?logout_challenge=challenge_mock`,
					headers: { 'X-Forwarded-Proto': 'https' },
				};

				// Act
				const response: ProviderRedirectResponse = await service.acceptLogoutRequest('challenge_mock');

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
