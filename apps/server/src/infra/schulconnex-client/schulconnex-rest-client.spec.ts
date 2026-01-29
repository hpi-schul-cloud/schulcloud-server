import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OauthAdapterService, OAuthTokenDto } from '@modules/oauth-adapter';
import { HttpService } from '@nestjs/axios';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { of } from 'rxjs';
import { SchulconnexConfigurationMissingLoggable } from './loggable';
import {
	SchulconnexPoliciesInfoLicenseResponse,
	SchulconnexPoliciesInfoResponse,
	SchulconnexResponse,
} from './response';
import { InternalSchulconnexClientConfig } from './schulconnex-client.config';
import { SchulconnexRestClient } from './schulconnex-rest-client';
import { schulconnexPoliciesInfoLicenseResponseFactory, schulconnexResponseFactory } from './testing';

describe(SchulconnexRestClient.name, () => {
	let client: SchulconnexRestClient;

	let httpService: DeepMocked<HttpService>;
	let oauthAdapterService: DeepMocked<OauthAdapterService>;
	let logger: DeepMocked<Logger>;
	const config: InternalSchulconnexClientConfig = {
		apiUrl: 'https://schulconnex.url/api',
		clientId: 'clientId',
		clientSecret: 'clientSecret',
		tokenEndpoint: 'https://schulconnex.url/token',
		personInfoTimeoutInMs: 30001,
		personenInfoTimeoutInMs: 30002,
		policiesInfoTimeoutInMs: 30003,
	};

	beforeAll(() => {
		httpService = createMock<HttpService>();
		oauthAdapterService = createMock<OauthAdapterService>();
		logger = createMock<Logger>();

		client = new SchulconnexRestClient(config, httpService, oauthAdapterService, logger);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('constructor', () => {
		describe('when configuration is missing', () => {
			const setup = () => {
				const badConfig: InternalSchulconnexClientConfig = {
					apiUrl: '',
					clientId: undefined,
					clientSecret: undefined,
					tokenEndpoint: '',
					personInfoTimeoutInMs: 3000,
					personenInfoTimeoutInMs: 120000,
					policiesInfoTimeoutInMs: 4000,
				};
				return {
					badConfig,
				};
			};

			it('should log a message', () => {
				const { badConfig } = setup();

				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const badOptionsClient = new SchulconnexRestClient(badConfig, httpService, oauthAdapterService, logger);

				expect(logger.debug).toHaveBeenCalledWith(new SchulconnexConfigurationMissingLoggable());
			});

			it('should reject promise if configuration is missing', async () => {
				const { badConfig } = setup();

				const badOptionsClient = new SchulconnexRestClient(badConfig, httpService, oauthAdapterService, logger);

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
				const response: SchulconnexResponse = schulconnexResponseFactory.build();

				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: response })));

				return {
					accessToken,
					response,
				};
			};

			it('should make a request to a SchulConneX-API', async () => {
				const { accessToken } = setup();

				await client.getPersonInfo(accessToken);

				expect(httpService.get).toHaveBeenCalledWith(`${config.apiUrl ?? ''}/person-info`, {
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Accept-Encoding': 'gzip',
					},
					timeout: config.personInfoTimeoutInMs,
				});
			});

			it('should return the response', async () => {
				const { accessToken, response } = setup();

				const result: SchulconnexResponse = await client.getPersonInfo(accessToken);

				expect(result).toEqual(response);
			});
		});

		describe('when overriding the url', () => {
			const setup = () => {
				const accessToken = 'accessToken';
				const customUrl = 'https://override.url/person-info';
				const response: SchulconnexResponse = schulconnexResponseFactory.build();

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
				const response: SchulconnexResponse[] = schulconnexResponseFactory.buildList(2);

				oauthAdapterService.sendTokenRequest.mockResolvedValueOnce(tokens);
				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: response })));

				return {
					tokens,
					response,
				};
			};

			it('should make a request to a SchulConneX-API', async () => {
				const { tokens } = setup();

				await client.getPersonenInfo({
					'organisation.id': '1234',
					vollstaendig: ['personen', 'organisationen'],
				});

				expect(httpService.get).toHaveBeenCalledWith(
					`${config.apiUrl ?? ''}/personen-info?organisation.id=1234&vollstaendig=personen%2Corganisationen`,
					{
						headers: {
							Authorization: `Bearer ${tokens.accessToken}`,
							'Accept-Encoding': 'gzip',
						},
						timeout: config.personenInfoTimeoutInMs,
					}
				);
			});

			it('should return the response', async () => {
				const { response } = setup();

				const result: SchulconnexResponse[] = await client.getPersonenInfo({ 'organisation.id': '1234' });

				expect(result).toEqual(response);
			});
		});
	});

	describe('getPoliciesInfo', () => {
		describe('when requesting policies-info', () => {
			const setup = () => {
				const accessToken = 'accessToken';
				const response: SchulconnexPoliciesInfoLicenseResponse[] =
					schulconnexPoliciesInfoLicenseResponseFactory.buildList(1);

				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: response })));

				return {
					accessToken,
				};
			};

			it('should make a request to a SchulConneX-API', async () => {
				const { accessToken } = setup();

				await client.getPoliciesInfo(accessToken);

				expect(httpService.get).toHaveBeenCalledWith(`${config.apiUrl ?? ''}/policies-info`, {
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Accept-Encoding': 'gzip',
					},
					timeout: config.policiesInfoTimeoutInMs,
				});
			});

			it('should return the response', async () => {
				const { accessToken } = setup();

				const result: SchulconnexPoliciesInfoResponse = await client.getPoliciesInfo(accessToken);

				expect(result).toBeDefined();
			});
		});

		describe('when overriding the url', () => {
			const setup = () => {
				const accessToken = 'accessToken';
				const customUrl = 'https://override.url/policies-info';
				const response: SchulconnexPoliciesInfoLicenseResponse[] =
					schulconnexPoliciesInfoLicenseResponseFactory.buildList(1);

				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: response })));

				return {
					accessToken,
					customUrl,
				};
			};

			it('should make a request to a SchulConneX-API', async () => {
				const { accessToken, customUrl } = setup();

				await client.getPoliciesInfo(accessToken, { overrideUrl: customUrl });

				expect(httpService.get).toHaveBeenCalledWith(customUrl, expect.anything());
			});
		});
	});
});
