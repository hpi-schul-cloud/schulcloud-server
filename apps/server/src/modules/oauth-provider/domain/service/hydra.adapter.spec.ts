import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosErrorFactory, axiosResponseFactory } from '@shared/testing';
import { AxiosRequestConfig } from 'axios';
import { of, throwError } from 'rxjs';
import { OauthProviderFeatures } from '../../oauth-provider-config';
import {
	acceptConsentRequestBodyFactory,
	acceptLoginRequestBodyFactory,
	introspectResponseFactory,
	providerConsentResponseFactory,
	providerConsentSessionResponseFactory,
	providerLoginResponseFactory,
	providerOauthClientFactory,
	rejectRequestBodyFactory,
} from '../../testing';
import { HydraOauthFailedLoggableException } from '../error';
import {
	AcceptConsentRequestBody,
	AcceptLoginRequestBody,
	IntrospectResponse,
	ProviderConsentResponse,
	ProviderConsentSessionResponse,
	ProviderLoginResponse,
	ProviderOauthClient,
	ProviderRedirectResponse,
	RejectRequestBody,
} from '../interface';
import { HydraAdapter } from './hydra.adapter';

describe('HydraService', () => {
	let module: TestingModule;
	let service: HydraAdapter;

	let httpService: DeepMocked<HttpService>;

	const hydraUri = 'http://hydra.uri';

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				HydraAdapter,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: OauthProviderFeatures,
					useValue: {
						hydraUri,
					},
				},
			],
		}).compile();

		service = module.get(HydraAdapter);
		httpService = module.get(HttpService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('listOAuth2Clients', () => {
		describe('when only clientIds are given', () => {
			const setup = () => {
				const data: ProviderOauthClient[] = providerOauthClientFactory.buildList(2);

				httpService.request.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data,
						})
					)
				);

				return {
					data,
				};
			};

			it('should call the external provider', async () => {
				setup();

				await service.listOAuth2Clients();

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

			it('should list all oauth2 clients', async () => {
				const { data } = setup();

				const result: ProviderOauthClient[] = await service.listOAuth2Clients();

				expect(result).toEqual(data);
			});
		});

		describe('when clientId and other parameters are given', () => {
			const setup = () => {
				const data: ProviderOauthClient[] = providerOauthClientFactory.buildList(2, {
					client_name: 'client1',
					owner: 'clientOwner',
				});

				httpService.request.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data,
						})
					)
				);

				return {
					data,
				};
			};

			it('should call the external provider', async () => {
				setup();

				await service.listOAuth2Clients(1, 0, 'client1', 'clientOwner');

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

			it('should list all oauth2 clients within parameters', async () => {
				const { data } = setup();

				const result: ProviderOauthClient[] = await service.listOAuth2Clients(1, 0, 'client1', 'clientOwner');

				expect(result).toEqual(data);
			});
		});

		describe('when hydra returns an axios error', () => {
			it('should throw an error', async () => {
				httpService.request.mockReturnValueOnce(throwError(() => axiosErrorFactory.build()));

				await expect(service.listOAuth2Clients()).rejects.toThrow(HydraOauthFailedLoggableException);
			});
		});

		describe('when an unknown error occurs during the request', () => {
			it('should throw an error', async () => {
				const error = new Error();

				httpService.request.mockReturnValueOnce(throwError(() => error));

				await expect(service.listOAuth2Clients()).rejects.toThrow(error);
			});
		});
	});

	describe('getOAuth2Client', () => {
		describe('when fetching an oauth2 client', () => {
			const setup = () => {
				const data: ProviderOauthClient = providerOauthClientFactory.build();

				httpService.request.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data,
						})
					)
				);

				return {
					data,
				};
			};

			it('should call the external provider', async () => {
				setup();

				await service.getOAuth2Client('clientId');

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

			it('should get oauth2 client', async () => {
				const { data } = setup();

				const result: ProviderOauthClient = await service.getOAuth2Client('clientId');

				expect(result).toEqual(data);
			});
		});
	});

	describe('createOAuth2Client', () => {
		describe('when creating an oauth2 client', () => {
			const setup = () => {
				const data: ProviderOauthClient = providerOauthClientFactory.build();

				httpService.request.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data,
						})
					)
				);

				return {
					data,
				};
			};

			it('should call the external provider', async () => {
				const { data } = setup();

				await service.createOAuth2Client(data);

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

			it('should create oauth2 client', async () => {
				const { data } = setup();

				const result: ProviderOauthClient = await service.createOAuth2Client(data);

				expect(result).toEqual(data);
			});
		});
	});

	describe('updateOAuth2Client', () => {
		describe('when updating an oauth2 client', () => {
			const setup = () => {
				const data: ProviderOauthClient = providerOauthClientFactory.build();

				httpService.request.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data,
						})
					)
				);

				return {
					data,
				};
			};

			it('should call the external provider', async () => {
				const { data } = setup();

				await service.updateOAuth2Client('clientId', data);

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

			it('should update the oauth2 client', async () => {
				const { data } = setup();

				const result: ProviderOauthClient = await service.updateOAuth2Client('clientId', data);

				expect(result).toEqual(data);
			});
		});
	});

	describe('deleteOAuth2Client', () => {
		describe('when deleting an oauth2 client', () => {
			const setup = () => {
				httpService.request.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data: {},
						})
					)
				);
			};

			it('should delete the oauth2 client', async () => {
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

	describe('getConsentRequest', () => {
		describe('when fetching a consent request', () => {
			const setup = () => {
				const challenge = 'challengexyz';
				const config: AxiosRequestConfig = {
					method: 'GET',
					url: `${hydraUri}/oauth2/auth/requests/consent?consent_challenge=${challenge}`,
				};
				const providerConsentResponse: ProviderConsentResponse = providerConsentResponseFactory.build({ challenge });

				httpService.request.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data: providerConsentResponse,
						})
					)
				);

				return {
					config,
					challenge,
				};
			};

			it('should call the external provider', async () => {
				const { config, challenge } = setup();

				await service.getConsentRequest(challenge);

				expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
			});

			it('should return the consent request', async () => {
				const { challenge } = setup();

				const result: ProviderConsentResponse = await service.getConsentRequest(challenge);

				expect(result.challenge).toEqual(challenge);
			});
		});
	});

	describe('acceptConsentRequest', () => {
		describe('when accepting a consent request', () => {
			const setup = () => {
				const challenge = 'challengexyz';
				const body: AcceptConsentRequestBody = acceptConsentRequestBodyFactory.build();
				const config: AxiosRequestConfig = {
					method: 'PUT',
					url: `${hydraUri}/oauth2/auth/requests/consent/accept?consent_challenge=${challenge}`,
					data: body,
				};
				const expectedRedirectTo = 'redirectTo';
				httpService.request.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data: { redirect_to: expectedRedirectTo },
						})
					)
				);

				return {
					body,
					config,
					expectedRedirectTo,
					challenge,
				};
			};

			it('should call the external provider', async () => {
				const { body, config, challenge } = setup();

				await service.acceptConsentRequest(challenge, body);

				expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
			});

			it('should return a redirect', async () => {
				const { body, expectedRedirectTo, challenge } = setup();

				const result: ProviderRedirectResponse = await service.acceptConsentRequest(challenge, body);

				expect(result.redirect_to).toEqual(expectedRedirectTo);
			});
		});
	});

	describe('rejectConsentRequest', () => {
		describe('when rejecting a consent request', () => {
			const setup = () => {
				const challenge = 'challengexyz';
				const body: RejectRequestBody = rejectRequestBodyFactory.build();
				const config: AxiosRequestConfig = {
					method: 'PUT',
					url: `${hydraUri}/oauth2/auth/requests/consent/reject?consent_challenge=${challenge}`,
					data: body,
				};
				const expectedRedirectTo = 'redirectTo';
				httpService.request.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data: { redirect_to: expectedRedirectTo },
						})
					)
				);

				return {
					body,
					config,
					expectedRedirectTo,
					challenge,
				};
			};

			it('should call the external provider', async () => {
				const { body, config, challenge } = setup();

				await service.rejectConsentRequest(challenge, body);

				expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
			});

			it('should return a redirect', async () => {
				const { body, expectedRedirectTo, challenge } = setup();

				const result: ProviderRedirectResponse = await service.rejectConsentRequest(challenge, body);

				expect(result.redirect_to).toEqual(expectedRedirectTo);
			});
		});
	});

	describe('listConsentSessions', () => {
		describe('when listing all consent requests of a user', () => {
			const setup = () => {
				const response: ProviderConsentSessionResponse[] = providerConsentSessionResponseFactory.buildList(1);
				httpService.request.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data: response,
						})
					)
				);

				return {
					response,
				};
			};

			it('should call the external provider', async () => {
				setup();

				await service.listConsentSessions('userId');

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

			it('should list all consent sessions', async () => {
				const { response } = setup();

				const result: ProviderConsentSessionResponse[] = await service.listConsentSessions('userId');

				expect(result).toEqual(response);
			});
		});
	});

	describe('revokeConsentSession', () => {
		describe('when revoking a consent session', () => {
			const setup = () => {
				httpService.request.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data: {},
						})
					)
				);
			};

			it('should should call the external provider to revoke all consent sessions', async () => {
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
	});

	describe('acceptLogoutRequest', () => {
		describe('when accepting a logout request', () => {
			const setup = () => {
				const responseMock: ProviderRedirectResponse = { redirect_to: 'redirect_mock' };
				httpService.request.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data: responseMock,
						})
					)
				);
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

			it('should call the external provider', async () => {
				const { config } = setup();

				await service.acceptLogoutRequest('challenge_mock');

				expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
			});

			it('should return a redirect', async () => {
				const { responseMock } = setup();

				const response: ProviderRedirectResponse = await service.acceptLogoutRequest('challenge_mock');

				expect(response).toEqual(responseMock);
			});
		});
	});

	describe('introspectOAuth2Token', () => {
		describe('when fetching information about a token', () => {
			const setup = () => {
				const response: IntrospectResponse = introspectResponseFactory.build();

				httpService.request.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data: response,
						})
					)
				);

				return {
					response,
				};
			};

			it('should call the external provider', async () => {
				setup();

				await service.introspectOAuth2Token('token', 'scope');

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

			it('should return introspect', async () => {
				const { response } = setup();

				const result: IntrospectResponse = await service.introspectOAuth2Token('token', 'scope');

				expect(result).toEqual(response);
			});
		});
	});

	describe('isInstanceAlive', () => {
		describe('when checking if the external provider is alive', () => {
			const setup = () => {
				httpService.request.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data: true,
						})
					)
				);
			};

			it('should call the external provider', async () => {
				setup();

				await service.isInstanceAlive();

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

			it('should return if the external provider is alive', async () => {
				setup();

				const result: boolean = await service.isInstanceAlive();

				expect(result).toEqual(true);
			});
		});
	});

	describe('getLoginRequest', () => {
		describe('when fetching a login request', () => {
			const setup = () => {
				const providerLoginResponse: ProviderLoginResponse = providerLoginResponseFactory.build();
				const challenge = 'challengexyz';
				const requestConfig: AxiosRequestConfig = {
					method: 'GET',
					url: `${hydraUri}/oauth2/auth/requests/login?login_challenge=${challenge}`,
				};
				httpService.request.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data: providerLoginResponse,
						})
					)
				);

				return {
					requestConfig,
					challenge,
					providerLoginResponse,
				};
			};

			it('should call the external provider', async () => {
				const { requestConfig, challenge } = setup();

				await service.getLoginRequest(challenge);

				expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(requestConfig));
			});

			it('should return a login request', async () => {
				const { challenge, providerLoginResponse } = setup();

				const response: ProviderLoginResponse = await service.getLoginRequest(challenge);

				expect(response).toEqual(providerLoginResponse);
			});
		});
	});

	describe('acceptLoginRequest', () => {
		describe('when accepting a login request', () => {
			const setup = () => {
				const challenge = 'challengexyz';
				const body: AcceptLoginRequestBody = acceptLoginRequestBodyFactory.build();
				const config: AxiosRequestConfig = {
					method: 'PUT',
					url: `${hydraUri}/oauth2/auth/requests/login/accept?login_challenge=${challenge}`,
					data: body,
				};
				const expectedRedirectTo = 'redirectTo';
				httpService.request.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data: { redirect_to: expectedRedirectTo },
						})
					)
				);

				return {
					body,
					config,
					expectedRedirectTo,
					challenge,
				};
			};

			it('should call the external provider', async () => {
				const { body, config, challenge } = setup();

				await service.acceptLoginRequest(challenge, body);

				expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
			});

			it('should return a redirect', async () => {
				const { body, expectedRedirectTo, challenge } = setup();

				const result: ProviderRedirectResponse = await service.acceptLoginRequest(challenge, body);

				expect(result.redirect_to).toEqual(expectedRedirectTo);
			});
		});
	});

	describe('rejectLoginRequest', () => {
		describe('when rejecting a login request', () => {
			const setup = () => {
				const challenge = 'challengexyz';
				const body: RejectRequestBody = rejectRequestBodyFactory.build();
				const config: AxiosRequestConfig = {
					method: 'PUT',
					url: `${hydraUri}/oauth2/auth/requests/login/reject?login_challenge=${challenge}`,
					data: body,
				};
				const expectedRedirectTo = 'redirectTo';
				httpService.request.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data: { redirect_to: expectedRedirectTo },
						})
					)
				);

				return {
					body,
					config,
					expectedRedirectTo,
					challenge,
				};
			};

			it('should call the external provider', async () => {
				const { body, config, challenge } = setup();

				await service.rejectLoginRequest(challenge, body);

				expect(httpService.request).toHaveBeenCalledWith(expect.objectContaining(config));
			});

			it('should return a redirect', async () => {
				const { body, expectedRedirectTo, challenge } = setup();

				const result: ProviderRedirectResponse = await service.rejectLoginRequest(challenge, body);

				expect(result.redirect_to).toEqual(expectedRedirectTo);
			});
		});
	});
});
