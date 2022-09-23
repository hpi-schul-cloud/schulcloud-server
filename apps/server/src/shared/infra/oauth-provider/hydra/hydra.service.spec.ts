import { Test, TestingModule } from '@nestjs/testing';
import { HydraService } from '@shared/infra/oauth-provider/hydra/hydra.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse, Method } from 'axios';
import {
	AcceptConsentRequestBody,
	ProviderConsentResponse,
	ProviderOauthClient,
	ProviderRedirectResponse,
	RejectRequestBody,
} from '@shared/infra/oauth-provider/dto';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { NotImplementedException } from '@nestjs/common';
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

	describe('Client Flow', () => {
		describe('listOAuth2Clients', () => {
			it('should list all oauth2 clients', async () => {
				const data: ProviderOauthClient[] = [
					{
						client_id: 'client1',
					},
					{
						client_id: 'client2',
					},
				];

				httpService.request.mockReturnValue(of(createAxiosResponse(data)));

				const result: ProviderOauthClient[] = await service.listOAuth2Clients();

				expect(result).toEqual(data);
				expect(httpService.request).toHaveBeenCalledWith(
					expect.objectContaining({
						url: `${hydraUri}/clients`,
						method: 'GET',
						headers: {
							'X-Forwarded-Proto': 'https',
						},
					})
				);
			});

			it('should list all oauth2 clients within parameters', async () => {
				const data: ProviderOauthClient[] = [
					{
						client_id: 'client1',
						owner: 'clientOwner',
					},
				];

				httpService.request.mockReturnValue(of(createAxiosResponse(data)));

				const result: ProviderOauthClient[] = await service.listOAuth2Clients(1, 0, 'client1', 'clientOwner');

				expect(result).toEqual(data);
				expect(httpService.request).toHaveBeenCalledWith(
					expect.objectContaining({
						url: `${hydraUri}/clients?limit=1&offset=0&client_name=client1&owner=clientOwner`,
						method: 'GET',
						headers: {
							'X-Forwarded-Proto': 'https',
						},
					})
				);
			});
		});

		describe('getOAuth2Client', () => {
			it('should get oauth2 client', async () => {
				const data: ProviderOauthClient = {
					client_id: 'client',
				};
				httpService.request.mockReturnValue(of(createAxiosResponse(data)));

				const result: ProviderOauthClient = await service.getOAuth2Client('clientId');

				expect(result).toEqual(data);
				expect(httpService.request).toHaveBeenCalledWith(
					expect.objectContaining({
						url: `${hydraUri}/clients/clientId`,
						method: 'GET',
						headers: {
							'X-Forwarded-Proto': 'https',
						},
					})
				);
			});
		});

		describe('createOAuth2Client', () => {
			it('should create oauth2 client', async () => {
				const data: ProviderOauthClient = {
					client_id: 'client',
				};
				httpService.request.mockReturnValue(of(createAxiosResponse(data)));

				const result: ProviderOauthClient = await service.createOAuth2Client(data);

				expect(result).toEqual(data);
				expect(httpService.request).toHaveBeenCalledWith(
					expect.objectContaining({
						url: `${hydraUri}/clients`,
						method: 'POST',
						headers: {
							'X-Forwarded-Proto': 'https',
						},
						data,
					})
				);
			});
		});

		describe('updateOAuth2Client', () => {
			it('should update oauth2 client', async () => {
				const data: ProviderOauthClient = {
					client_id: 'client',
				};
				httpService.request.mockReturnValue(of(createAxiosResponse(data)));

				const result: ProviderOauthClient = await service.updateOAuth2Client('clientId', data);

				expect(result).toEqual(data);
				expect(httpService.request).toHaveBeenCalledWith(
					expect.objectContaining({
						url: `${hydraUri}/clients/clientId`,
						method: 'PUT',
						headers: {
							'X-Forwarded-Proto': 'https',
						},
						data,
					})
				);
			});
		});

		describe('deleteOAuth2Client', () => {
			it('should delete oauth2 client', async () => {
				httpService.request.mockReturnValue(of(createAxiosResponse({})));

				await service.deleteOAuth2Client('clientId');

				expect(httpService.request).toHaveBeenCalledWith(
					expect.objectContaining({
						url: `${hydraUri}/clients/clientId`,
						method: 'DELETE',
						headers: {
							'X-Forwarded-Proto': 'https',
						},
					})
				);
			});
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
				httpService.request.mockReturnValue(of(createAxiosResponse<ProviderConsentResponse>({ challenge })));

				// Act
				const result: ProviderConsentResponse = await service.getConsentRequest(challenge);

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
