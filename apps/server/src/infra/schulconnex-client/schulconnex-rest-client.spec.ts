import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OauthAdapterService, OAuthTokenDto } from '@modules/oauth';
import { HttpService } from '@nestjs/axios';
import { TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@shared/testing';
import { of } from 'rxjs';
import { SanisResponse } from './response';
import { SchulconnexRestClient } from './schulconnex-rest-client';
import { SchulconnexRestClientOptions } from './schulconnex-rest-client-options';
import { schulconnexResponseFactory } from './testing';

describe(SchulconnexRestClient.name, () => {
	let module: TestingModule;
	let client: SchulconnexRestClient;

	let httpService: DeepMocked<HttpService>;
	let oauthAdapterService: DeepMocked<OauthAdapterService>;
	const options: SchulconnexRestClientOptions = {
		apiUrl: 'https://schulconnex.url/api',
		clientId: 'clientId',
		clientSecret: 'clientSecret',
		tokenEndpoint: 'https://schulconnex.url/token',
	};

	beforeAll(() => {
		httpService = createMock<HttpService>();
		oauthAdapterService = createMock<OauthAdapterService>();

		client = new SchulconnexRestClient(options, httpService, oauthAdapterService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
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

				expect(httpService.get).toHaveBeenCalledWith(`${options.apiUrl}/person-info`, {
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

				oauthAdapterService.sendTokenRequest.mockResolvedValueOnce(tokens);
				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: response })));

				return {
					tokens,
					response,
				};
			};

			it('should make a request to a SchulConneX-API', async () => {
				const { tokens } = setup();

				await client.getPersonenInfo({ 'organisation.id': '1234', vollstaendig: ['personen', 'organisationen'] });

				expect(httpService.get).toHaveBeenCalledWith(
					`${options.apiUrl}/personen-info?organisation.id=1234&vollstaendig=personen%2Corganisationen`,
					{
						headers: {
							Authorization: `Bearer ${tokens.accessToken}`,
							'Accept-Encoding': 'gzip',
						},
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
});
