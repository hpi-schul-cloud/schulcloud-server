import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@core/logger';
import { AxiosErrorLoggable } from '@core/error/loggable';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { axiosErrorFactory } from '@testing/factory/axios-error.factory';
import { DefaultEncryptionService, EncryptionService, SymmetricKeyEncryptionService } from '@infra/encryption';
import {
	MediaSource,
	MediaSourceDataFormat,
	MediaSourceOauthConfig,
	MediaSourceOauthConfigNotFoundLoggableException,
} from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import {
	ClientCredentialsGrantTokenRequest,
	OauthAdapterService,
	OAuthGrantType,
	OAuthTokenDto,
} from '@modules/oauth-adapter';
import { AxiosResponse } from 'axios';
import { ValidationError } from 'class-validator';
import { of, throwError } from 'rxjs';
import { MediaQueryBadResponseReport } from './interface';
import { BiloMediaQueryBadResponseLoggable } from './loggable';
import { BiloMediaQueryBodyParams } from './request';
import { BiloLinkResponse, BiloMediaQueryDataResponse, BiloMediaQueryResponse } from './response';
import { biloMediaQueryResponseFactory, biloMediaQueryDataResponseFactory } from './testing';
import { BiloMediaClientAdapter } from './bilo-media-client.adapter';

describe(BiloMediaClientAdapter.name, () => {
	let module: TestingModule;
	let service: BiloMediaClientAdapter;

	let httpService: DeepMocked<HttpService>;
	let logger: DeepMocked<Logger>;
	let oauthAdapterService: DeepMocked<OauthAdapterService>;
	let encryptionService: DeepMocked<SymmetricKeyEncryptionService>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				BiloMediaClientAdapter,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: OauthAdapterService,
					useValue: createMock<OauthAdapterService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();

		service = module.get(BiloMediaClientAdapter);
		httpService = module.get(HttpService);
		oauthAdapterService = module.get(OauthAdapterService);
		encryptionService = module.get(DefaultEncryptionService);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('fetchMediaMetadata', () => {
		describe('when the metadata are fetched successfully', () => {
			const setup = () => {
				const mediaSource: MediaSource = mediaSourceFactory.withBildungslogin().build();

				const mockToken = new OAuthTokenDto({
					accessToken: 'mock-access-token',
					idToken: 'mock-id-token',
					refreshToken: 'mock-refresh-token',
				});

				const mockResponseData: BiloMediaQueryResponse[] = biloMediaQueryResponseFactory.buildList(2);
				const mediumIds = mockResponseData.map((response: BiloMediaQueryResponse) => response.query.id);

				const mockAxiosResponse = axiosResponseFactory.build({
					data: mockResponseData,
				}) as AxiosResponse<BiloMediaQueryResponse[]>;

				const decryptedClientSecret = 'client-secret-decrypted';

				jest.spyOn(oauthAdapterService, 'sendTokenRequest').mockResolvedValueOnce(mockToken);
				jest.spyOn(httpService, 'post').mockReturnValueOnce(of(mockAxiosResponse));
				jest.spyOn(encryptionService, 'decrypt').mockReturnValueOnce(decryptedClientSecret);

				const expectedBiloRequestBody = mediumIds.map((id: string) => ({ id } as BiloMediaQueryBodyParams));

				const expectedMetadataItems = mockResponseData.map((responseData: BiloMediaQueryResponse) => responseData.data);

				return {
					mediumIds,
					mediaSource,
					mockToken,
					decryptedClientSecret,
					expectedBiloRequestBody,
					expectedMetadataItems,
				};
			};

			it('should decrypt the oauth client secret', async () => {
				const { mediumIds, mediaSource } = setup();

				await service.fetchMediaMetadata(mediumIds, mediaSource);

				const oauthConfig = mediaSource.oauthConfig as MediaSourceOauthConfig;
				expect(encryptionService.decrypt).toHaveBeenCalledWith(oauthConfig.clientSecret);
			});

			it('should call oauth adapter to fetch the oauth token', async () => {
				const { mediumIds, mediaSource, decryptedClientSecret } = setup();

				await service.fetchMediaMetadata(mediumIds, mediaSource);

				const oauthConfig = mediaSource.oauthConfig as MediaSourceOauthConfig;
				expect(oauthAdapterService.sendTokenRequest).toHaveBeenCalledWith(oauthConfig.authEndpoint, {
					client_id: oauthConfig.clientId,
					client_secret: decryptedClientSecret,
					grant_type: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
				} as ClientCredentialsGrantTokenRequest);
			});

			it('should call http service with the correct params and headers', async () => {
				const { mediumIds, mediaSource, expectedBiloRequestBody, mockToken } = setup();

				await service.fetchMediaMetadata(mediumIds, mediaSource);

				const oauthConfig = mediaSource.oauthConfig as MediaSourceOauthConfig;
				expect(httpService.post).toHaveBeenCalledWith(
					`${oauthConfig.baseUrl}/query`,
					expect.arrayContaining(expectedBiloRequestBody),
					expect.objectContaining({
						headers: {
							Authorization: `Bearer ${mockToken.accessToken}`,
							'Content-Type': 'application/vnd.de.bildungslogin.mediaquery+json',
						},
					})
				);
			});

			it('should return a list of bilo media query response', async () => {
				const { mediumIds, mediaSource, expectedMetadataItems } = setup();

				const result = await service.fetchMediaMetadata(mediumIds, mediaSource);

				expect(result).toEqual(expect.arrayContaining(expectedMetadataItems));
			});
		});

		describe('when the metadata fetched have bad status', () => {
			const setup = () => {
				const mediaSource: MediaSource = mediaSourceFactory.withBildungslogin().build();

				const mockToken = new OAuthTokenDto({
					accessToken: 'mock-access-token',
					idToken: 'mock-id-token',
					refreshToken: 'mock-refresh-token',
				});

				const validResponses: BiloMediaQueryResponse[] = biloMediaQueryResponseFactory.buildList(2);
				const badStatusResponses: BiloMediaQueryResponse[] = biloMediaQueryResponseFactory.buildList(2, {
					status: 404,
				});
				const responses = [...validResponses, ...badStatusResponses];

				const mediumIds = responses.map((response: BiloMediaQueryResponse) => response.query.id);

				const mockAxiosResponse = axiosResponseFactory.build({
					data: responses,
				}) as AxiosResponse<BiloMediaQueryResponse[]>;

				const decryptedClientSecret = 'client-secret-decrypted';

				jest.spyOn(oauthAdapterService, 'sendTokenRequest').mockResolvedValueOnce(mockToken);
				jest.spyOn(httpService, 'post').mockReturnValueOnce(of(mockAxiosResponse));
				jest.spyOn(encryptionService, 'decrypt').mockReturnValueOnce(decryptedClientSecret);

				const expectedMetadataItems = validResponses.map((response: BiloMediaQueryResponse) => response.data);

				const expectedBadStatusReports = badStatusResponses.map((response: BiloMediaQueryResponse) => {
					const report: MediaQueryBadResponseReport = {
						mediumId: response.query.id,
						status: response.status,
						validationErrors: [],
					};

					return report;
				});

				return {
					mediumIds,
					mediaSource,
					mockToken,
					expectedMetadataItems,
					expectedBadStatusReports,
				};
			};

			it('should return media metadata only from responses with valid status', async () => {
				const { mediumIds, mediaSource, expectedMetadataItems } = setup();

				const result = await service.fetchMediaMetadata(mediumIds, mediaSource);

				expect(result).toEqual(expect.arrayContaining(expectedMetadataItems));
			});

			it('should log the responses with bad status as debug log', async () => {
				const { mediumIds, mediaSource, expectedBadStatusReports } = setup();

				await service.fetchMediaMetadata(mediumIds, mediaSource);

				expect(logger.debug).toHaveBeenCalledWith(new BiloMediaQueryBadResponseLoggable(expectedBadStatusReports));
			});
		});

		describe('when the metadata fetched have validation errors', () => {
			const setup = () => {
				const mediaSource: MediaSource = mediaSourceFactory.withBildungslogin().build();

				const mockToken = new OAuthTokenDto({
					accessToken: 'mock-access-token',
					idToken: 'mock-id-token',
					refreshToken: 'mock-refresh-token',
				});

				const validResponses: BiloMediaQueryResponse[] = biloMediaQueryResponseFactory.buildList(2);

				const invalidMetadataItems: BiloMediaQueryDataResponse[] = biloMediaQueryDataResponseFactory.buildList(2, {
					title: undefined,
					modified: undefined,
					cover: { href: 'test', rel: 'src' } as BiloLinkResponse,
				});

				const badResponses: BiloMediaQueryResponse[] = invalidMetadataItems.map((data: BiloMediaQueryDataResponse) =>
					biloMediaQueryResponseFactory.build({
						query: { id: data.id } as BiloMediaQueryBodyParams,
						status: 200,
						data,
					})
				);

				const responses = [...validResponses, ...badResponses];

				const mediumIds = responses.map((response: BiloMediaQueryResponse) => response.query.id);

				const mockAxiosResponse = axiosResponseFactory.build({
					data: responses,
				}) as AxiosResponse<BiloMediaQueryResponse[]>;

				const decryptedClientSecret = 'client-secret-decrypted';

				jest.spyOn(oauthAdapterService, 'sendTokenRequest').mockResolvedValueOnce(mockToken);
				jest.spyOn(httpService, 'post').mockReturnValueOnce(of(mockAxiosResponse));
				jest.spyOn(encryptionService, 'decrypt').mockReturnValueOnce(decryptedClientSecret);

				const expectedMetadataItems = validResponses.map((response: BiloMediaQueryResponse) => response.data);

				const expectedBadResponseReports = badResponses.map((response: BiloMediaQueryResponse) => {
					const report: MediaQueryBadResponseReport = {
						mediumId: response.query.id,
						status: response.status,
						validationErrors: expect.any(Array) as ValidationError[],
					};

					return report;
				});

				return {
					mediumIds,
					mediaSource,
					mockToken,
					expectedMetadataItems,
					expectedBadResponseReports,
				};
			};

			it('should return media metadata only from valid responses', async () => {
				const { mediumIds, mediaSource, expectedMetadataItems } = setup();

				const result = await service.fetchMediaMetadata(mediumIds, mediaSource);

				expect(result).toEqual(expect.arrayContaining(expectedMetadataItems));
			});

			it('should log the bad responses as debug log', async () => {
				const { mediumIds, mediaSource, expectedBadResponseReports } = setup();

				await service.fetchMediaMetadata(mediumIds, mediaSource);

				expect(logger.debug).toHaveBeenCalledWith(new BiloMediaQueryBadResponseLoggable(expectedBadResponseReports));
			});
		});

		describe('when the oauth config of the media source is missing', () => {
			const setup = () => {
				const mediumIds = ['123'];
				const mediaSource: MediaSource = mediaSourceFactory.build({ oauthConfig: undefined });

				return { mediumIds, mediaSource };
			};

			it('should throw an MediaSourceOauthConfigNotFoundLoggableException', async () => {
				const { mediumIds, mediaSource } = setup();

				const promise = service.fetchMediaMetadata(mediumIds, mediaSource);

				await expect(promise).rejects.toThrow(
					new MediaSourceOauthConfigNotFoundLoggableException(mediaSource.id, MediaSourceDataFormat.BILDUNGSLOGIN)
				);
			});
		});

		describe('when an axios error is thrown while fetching the metadata', () => {
			const setup = () => {
				const mediumIds = ['123'];
				const mediaSource: MediaSource = mediaSourceFactory.withBildungslogin().build();

				const axiosError = axiosErrorFactory.build();

				httpService.post.mockReturnValueOnce(throwError(() => axiosError));

				return { mediumIds, mediaSource, axiosError };
			};

			it('should throw an AxiosErrorLoggable', async () => {
				const { mediumIds, mediaSource, axiosError } = setup();

				const promise = service.fetchMediaMetadata(mediumIds, mediaSource);

				await expect(promise).rejects.toThrow(new AxiosErrorLoggable(axiosError, 'BILO_GET_MEDIA_METADATA_FAILED'));
			});
		});

		describe('when an unknown error is thrown while fetching the metadata', () => {
			const setup = () => {
				const mediumIds = ['123'];
				const mediaSource: MediaSource = mediaSourceFactory.withBildungslogin().build();

				const unknownError = new Error();

				httpService.post.mockReturnValueOnce(throwError(() => unknownError));

				return { mediumIds, mediaSource, unknownError };
			};

			it('should throw the unknown error', async () => {
				const { mediumIds, mediaSource, unknownError } = setup();

				const promise = service.fetchMediaMetadata(mediumIds, mediaSource);

				await expect(promise).rejects.toThrow(unknownError);
			});
		});
	});
});
