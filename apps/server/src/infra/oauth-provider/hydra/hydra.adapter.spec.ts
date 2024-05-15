import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import {
	AcceptConsentRequestBody,
	AcceptLoginRequestBody,
	IntrospectResponse,
	ProviderConsentResponse,
	ProviderLoginResponse,
	ProviderOauthClient,
	ProviderRedirectResponse,
	RejectRequestBody,
} from '@infra/oauth-provider/dto';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory, axiosErrorFactory } from '@shared/testing/factory';
import { AxiosError, AxiosRequestConfig, Method, RawAxiosRequestHeaders } from 'axios';
import { of, throwError } from 'rxjs';
import { ProviderConsentSessionResponse } from '../dto';
import { HydraOauthFailedLoggableException } from '../loggable';
import { HydraAdapter } from './hydra.adapter';
import resetAllMocks = jest.resetAllMocks;

class HydraAdapterSpec extends HydraAdapter {
	public async requestSpec<T>(
		method: Method,
		url: string,
		data?: unknown,
		additionalHeaders?: RawAxiosRequestHeaders
	): Promise<T> {
		return super.request(method, url, data, additionalHeaders);
	}
}

const createAxiosResponse = <T>(data: T) =>
	axiosResponseFactory.build({
		data,
	});

describe('HydraService', () => {
	let module: TestingModule;
	let service: HydraAdapterSpec;

	let httpService: DeepMocked<HttpService>;

	const hydraUri = 'http://hydra.uri';

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockReturnValue(hydraUri);

		module = await Test.createTestingModule({
			providers: [
				HydraAdapterSpec,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();

		service = module.get(HydraAdapterSpec);
		httpService = module.get(HttpService);
	});

	afterAll(async () => {
		await module.close();
		jest.clearAllMocks();
	});

	describe('request', () => {
		describe('when called with all parameters', () => {
			const setup = () => {
				const data: { test: string } = {
					test: 'data',
				};

				httpService.request.mockReturnValue(of(createAxiosResponse(data)));

				return {
					data,
				};
			};

			it('should return data', async () => {
				const { data } = setup();

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
		});

		describe('when called with only necessary parameters', () => {
			const setup = () => {
				const data: { test: string } = {
					test: 'data',
				};

				httpService.request.mockReturnValue(of(createAxiosResponse(data)));

				return {
					data,
				};
			};

			it('should return data', async () => {
				const { data } = setup();

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

		describe('when error occurs', () => {
			describe('when error is an axios error', () => {
				const setup = () => {
					const error = {
						error: 'invalid_request',
					};
					const axiosError: AxiosError = axiosErrorFactory.withError(error).build({});

					httpService.request.mockReturnValueOnce(throwError(() => axiosError));

					return {
						axiosError,
					};
				};

				it('should throw hydra oauth loggable exception', async () => {
					const { axiosError } = setup();

					await expect(service.listOAuth2Clients()).rejects.toThrow(new HydraOauthFailedLoggableException(axiosError));
				});
			});

			describe('when error is any other error', () => {
				const setup = () => {
					httpService.request.mockReturnValueOnce(throwError(() => new Error('unknown error')));
				};

				it('should throw the error', async () => {
					setup();

					await expect(service.listOAuth2Clients()).rejects.toThrow(new Error('unknown error'));
				});
			});
		});
	});

	describe('Client Flow', () => {
		describe('listOAuth2Clients', () => {
			describe('when only clientIds are given', () => {
				const setup = () => {
					const data: ProviderOauthClient[] = [
						{
							client_id: 'client1',
						},
						{
							client_id: 'client2',
						},
					];

					httpService.request.mockReturnValue(of(createAxiosResponse(data)));

					return {
						data,
					};
				};

				it('should list all oauth2 clients', async () => {
					const { data } = setup();

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
			});

			describe('when clientId and other parameters are given', () => {
				const setup = () => {
					const data: ProviderOauthClient[] = [
						{
							client_id: 'client1',
							owner: 'clientOwner',
						},
					];

					httpService.request.mockReturnValue(of(createAxiosResponse(data)));

					return {
						data,
					};
				};

				it('should list all oauth2 clients within parameters', async () => {
					const { data } = setup();

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
		});

		describe('getOAuth2Client', () => {
			const setup = () => {
				const data: ProviderOauthClient = {
					client_id: 'client',
				};
				httpService.request.mockReturnValue(of(createAxiosResponse(data)));

				return {
					data,
				};
			};

			it('should get oauth2 client', async () => {
				const { data } = setup();

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
			const setup = () => {
				const data: ProviderOauthClient = {
					client_id: 'client',
				};
				httpService.request.mockReturnValue(of(createAxiosResponse(data)));

				return {
					data,
				};
			};

			it('should create oauth2 client', async () => {
				const { data } = setup();

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
			const setup = () => {
				const data: ProviderOauthClient = {
					client_id: 'client',
				};
				httpService.request.mockReturnValue(of(createAxiosResponse(data)));

				return {
					data,
				};
			};

			it('should update oauth2 client', async () => {
				const { data } = setup();

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
			const setup = () => {
				httpService.request.mockReturnValue(of(createAxiosResponse({})));
			};

			it('should delete oauth2 client', async () => {
				setup();

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
			const setup = () => {
				const config: AxiosRequestConfig = {
					method: 'GET',
					url: `${hydraUri}/oauth2/auth/requests/consent?consent_challenge=${challenge}`,
				};
				httpService.request.mockReturnValue(of(createAxiosResponse<ProviderConsentResponse>({ challenge })));

				return {
					config,
				};
			};

			it('should make http request', async () => {
				const { config } = setup();

				const result: ProviderConsentResponse = await service.getConsentRequest(challenge);

				expect(result.challenge).toEqual(challenge);
				expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
			});
		});

		describe('acceptConsentRequest', () => {
			const setup = () => {
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

				return {
					body,
					config,
					expectedRedirectTo,
				};
			};

			it('should make http request', async () => {
				const { body, config, expectedRedirectTo } = setup();

				const result: ProviderRedirectResponse = await service.acceptConsentRequest(challenge, body);

				expect(result.redirect_to).toEqual(expectedRedirectTo);
				expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
			});
		});

		describe('rejectConsentRequest', () => {
			const setup = () => {
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

				return {
					body,
					config,
					expectedRedirectTo,
				};
			};

			it('should make http request', async () => {
				const { body, config, expectedRedirectTo } = setup();

				const result: ProviderRedirectResponse = await service.rejectConsentRequest(challenge, body);

				expect(result.redirect_to).toEqual(expectedRedirectTo);
				expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
			});
		});

		describe('listConsentSessions', () => {
			const setup = () => {
				const response: ProviderConsentSessionResponse[] = [{ consent_request: { challenge: 'challenge' } }];
				httpService.request.mockReturnValue(of(createAxiosResponse(response)));

				return {
					response,
				};
			};

			it('should list all consent sessions', async () => {
				const { response } = setup();

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
			const setup = () => {
				httpService.request.mockReturnValue(of(createAxiosResponse({})));
			};

			it('should revoke all consent sessions', async () => {
				setup();

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

		describe('Logout Flow', () => {
			describe('acceptLogoutRequest', () => {
				const setup = () => {
					const responseMock: ProviderRedirectResponse = { redirect_to: 'redirect_mock' };
					httpService.request.mockReturnValue(of(createAxiosResponse(responseMock)));
					const config: AxiosRequestConfig = {
						method: 'PUT',
						url: `${hydraUri}/oauth2/auth/requests/logout/accept?logout_challenge=challenge_mock`,
						headers: { 'X-Forwarded-Proto': 'https' },
					};

					return {
						responseMock,
						config,
					};
				};

				it('should make http request', async () => {
					const { responseMock, config } = setup();

					const response: ProviderRedirectResponse = await service.acceptLogoutRequest('challenge_mock');

					expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
					expect(response).toEqual(responseMock);
				});
			});
		});

		describe('Miscellaneous', () => {
			describe('introspectOAuth2Token', () => {
				const setup = () => {
					const response: IntrospectResponse = {
						active: true,
					};
					httpService.request.mockReturnValue(of(createAxiosResponse(response)));

					return {
						response,
					};
				};

				it('should return introspect', async () => {
					const { response } = setup();

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
				const setup = () => {
					httpService.request.mockReturnValue(of(createAxiosResponse(true)));
				};

				it('should check if hydra is alive', async () => {
					setup();

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

		describe('Login Flow', () => {
			const providerLoginResponse: ProviderLoginResponse = {
				challenge: 'challenge',
				client: {
					client_id: 'client_id',
					created_at: '2020-01-01T00:00:00.000Z',
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

			afterEach(() => {
				resetAllMocks();
			});

			describe('getLoginRequest', () => {
				const setup = () => {
					const requestConfig: AxiosRequestConfig = {
						method: 'GET',
						url: `${hydraUri}/oauth2/auth/requests/login?login_challenge=${challenge}`,
					};
					httpService.request.mockReturnValue(of(createAxiosResponse<ProviderLoginResponse>(providerLoginResponse)));

					return {
						requestConfig,
					};
				};

				it('should send login request', async () => {
					const { requestConfig } = setup();

					const response: ProviderLoginResponse = await service.getLoginRequest(challenge);

					expect(response).toEqual(providerLoginResponse);
					expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(requestConfig));
				});
			});

			describe('acceptLoginRequest', () => {
				const setup = () => {
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

					return {
						body,
						config,
						expectedRedirectTo,
					};
				};

				it('should send accept login request', async () => {
					const { body, config, expectedRedirectTo } = setup();

					const result: ProviderRedirectResponse = await service.acceptLoginRequest(challenge, body);

					expect(result.redirect_to).toEqual(expectedRedirectTo);
					expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
				});
			});

			describe('rejectLoginRequest', () => {
				const setup = () => {
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

					return {
						body,
						config,
						expectedRedirectTo,
					};
				};

				it('should send reject login request', async () => {
					const { body, config, expectedRedirectTo } = setup();

					const result: ProviderRedirectResponse = await service.rejectLoginRequest(challenge, body);

					expect(result.redirect_to).toEqual(expectedRedirectTo);
					expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
				});
			});
		});
	});
});
