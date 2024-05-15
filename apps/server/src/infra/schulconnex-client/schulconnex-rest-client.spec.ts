import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OauthAdapterService, OAuthTokenDto } from '@modules/oauth';
import { HttpService } from '@nestjs/axios';
import { axiosResponseFactory } from '@shared/testing/factory';
import { Logger } from '@src/core/logger';
import { of } from 'rxjs';
import { SchulconnexConfigurationMissingLoggable } from './loggable';
import { SanisResponse, SchulconnexLizenzInfoResponse } from './response';
import { SchulconnexRestClient } from './schulconnex-rest-client';
import { SchulconnexRestClientOptions } from './schulconnex-rest-client-options';
import { schulconnexResponseFactory } from './testing';
import { schulconnexLizenzInfoResponseFactory } from './testing/schulconnex-lizenz-info-response-factory';

describe(SchulconnexRestClient.name, () => {
	let client: SchulconnexRestClient;

	let httpService: DeepMocked<HttpService>;
	let oauthAdapterService: DeepMocked<OauthAdapterService>;
	let logger: DeepMocked<Logger>;
	const options: SchulconnexRestClientOptions = {
		apiUrl: 'https://schulconnex.url/api',
		clientId: 'clientId',
		clientSecret: 'clientSecret',
		tokenEndpoint: 'https://schulconnex.url/token',
	};

	beforeAll(() => {
		httpService = createMock<HttpService>();
		oauthAdapterService = createMock<OauthAdapterService>();
		logger = createMock<Logger>();

		client = new SchulconnexRestClient(options, httpService, oauthAdapterService, logger);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('constructor', () => {
		describe('when configuration is missing', () => {
			const setup = () => {
				const badOptions: SchulconnexRestClientOptions = {
					apiUrl: '',
					clientId: undefined,
					clientSecret: undefined,
					tokenEndpoint: '',
				};
				return {
					badOptions,
				};
			};

			it('should log a message', () => {
				const { badOptions } = setup();

				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const badOptionsClient = new SchulconnexRestClient(badOptions, httpService, oauthAdapterService, logger);

				expect(logger.debug).toHaveBeenCalledWith(new SchulconnexConfigurationMissingLoggable());
			});

			it('should reject promise if configuration is missing', async () => {
				const { badOptions } = setup();

				const badOptionsClient = new SchulconnexRestClient(badOptions, httpService, oauthAdapterService, logger);

				await expect(badOptionsClient.getPersonenInfo({})).rejects.toThrow(
					'Missing configuration for SchulconnexRestClient'
				);
			});
		});
	});

	describe('getPersonInfo', () => {
		describe('when requesting person-info', () => {
			const setup = () => {
				const accessToken = 'accessToken';
				const response: SanisResponse = schulconnexResponseFactory.build();

				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: response })));

				return {
					accessToken,
					response,
				};
			};

			it('should make a request to a SchulConneX-API', async () => {
				const { accessToken } = setup();

				await client.getPersonInfo(accessToken);

				expect(httpService.get).toHaveBeenCalledWith(`${options.apiUrl ?? ''}/person-info`, {
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Accept-Encoding': 'gzip',
					},
				});
			});

			it('should return the response', async () => {
				const { accessToken, response } = setup();

				const result: SanisResponse = await client.getPersonInfo(accessToken);

				expect(result).toEqual(response);
			});
		});

		describe('when overriding the url', () => {
			const setup = () => {
				const accessToken = 'accessToken';
				const customUrl = 'https://override.url/person-info';
				const response: SanisResponse = schulconnexResponseFactory.build();

				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: response })));

				return {
					accessToken,
					customUrl,
				};
			};

			it('should make a request to a SchulConneX-API', async () => {
				const { accessToken, customUrl } = setup();

				await client.getPersonInfo(accessToken, { overrideUrl: customUrl });

				expect(httpService.get).toHaveBeenCalledWith(customUrl, expect.anything());
			});
		});
	});

	describe('getPersonenInfo', () => {
		describe('when requesting personen-info', () => {
			const setup = () => {
				const tokens: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'id_token',
					accessToken: 'access_token',
					refreshToken: 'refresh_token',
				});
				const response: SanisResponse[] = schulconnexResponseFactory.buildList(2);

				const optionsWithTimeout: SchulconnexRestClientOptions = {
					...options,
					personenInfoTimeoutInMs: 30000,
				};

				const optionsClient: SchulconnexRestClient = new SchulconnexRestClient(
					optionsWithTimeout,
					httpService,
					oauthAdapterService,
					logger
				);

				oauthAdapterService.sendTokenRequest.mockResolvedValueOnce(tokens);
				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: response })));

				return {
					tokens,
					response,
					optionsClient,
					optionsWithTimeout,
				};
			};

			it('should make a request to a SchulConneX-API', async () => {
				const { tokens, optionsClient, optionsWithTimeout } = setup();

				await optionsClient.getPersonenInfo({
					'organisation.id': '1234',
					vollstaendig: ['personen', 'organisationen'],
				});

				expect(httpService.get).toHaveBeenCalledWith(
					`${
						optionsWithTimeout.apiUrl ?? ''
					}/personen-info?organisation.id=1234&vollstaendig=personen%2Corganisationen`,
					{
						headers: {
							Authorization: `Bearer ${tokens.accessToken}`,
							'Accept-Encoding': 'gzip',
						},
						timeout: optionsWithTimeout.personenInfoTimeoutInMs,
					}
				);
			});

			it('should return the response', async () => {
				const { response } = setup();

				const result: SanisResponse[] = await client.getPersonenInfo({ 'organisation.id': '1234' });

				expect(result).toEqual(response);
			});
		});
	});

	describe('getLizenzInfo', () => {
		describe('when requesting lizenz-info', () => {
			const setup = () => {
				const accessToken = 'accessToken';
				const response: SchulconnexLizenzInfoResponse[] = schulconnexLizenzInfoResponseFactory.build();

				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: response })));

				return {
					accessToken,
				};
			};

			it('should make a request to a SchulConneX-API', async () => {
				const { accessToken } = setup();

				await client.getLizenzInfo(accessToken);

				expect(httpService.get).toHaveBeenCalledWith(`${options.apiUrl ?? ''}/lizenz-info`, {
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Accept-Encoding': 'gzip',
					},
				});
			});

			it('should return the response', async () => {
				const { accessToken } = setup();

				const result: SchulconnexLizenzInfoResponse[] = await client.getLizenzInfo(accessToken);

				expect(result).toBeDefined();
			});
		});

		describe('when overriding the url', () => {
			const setup = () => {
				const accessToken = 'accessToken';
				const customUrl = 'https://override.url/lizenz-info';
				const response: SchulconnexLizenzInfoResponse[] = schulconnexLizenzInfoResponseFactory.build();

				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: response })));

				return {
					accessToken,
					customUrl,
				};
			};

			it('should make a request to a SchulConneX-API', async () => {
				const { accessToken, customUrl } = setup();

				await client.getLizenzInfo(accessToken, { overrideUrl: customUrl });

				expect(httpService.get).toHaveBeenCalledWith(customUrl, expect.anything());
			});
		});
	});
});
