import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { DefaultEncryptionService, EncryptionService, SymmetricKeyEncryptionService } from '@infra/encryption';
import {
	MediaSource,
	MediaSourceDataFormat,
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
import { of } from 'rxjs';
import { BiloMediaQueryBodyParams } from '../request';
import { BiloMediaQueryResponse } from '../response';
import { biloMediaQueryResponseFactory } from '../testing';
import { BiloMediaFetchService } from './bilo-media-fetch.service';

describe('BiloMediaFetchService', () => {
	let module: TestingModule;
	let service: BiloMediaFetchService;
	let httpService: HttpService;
	let oauthAdapterService: DeepMocked<OauthAdapterService>;
	let encryptionService: DeepMocked<SymmetricKeyEncryptionService>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				BiloMediaFetchService,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
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

		service = module.get(BiloMediaFetchService);
		httpService = module.get(HttpService);
		oauthAdapterService = module.get(OauthAdapterService);
		encryptionService = module.get(DefaultEncryptionService);
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
		describe('when the media source has the oauth config', () => {
			const setup = () => {
				const mediaSource: MediaSource = mediaSourceFactory.withBildungslogin().build();

				const mockToken = new OAuthTokenDto({
					accessToken: 'mockAccessToken',
					idToken: 'mockIdToken',
					refreshToken: 'mockRefreshToken',
				});

				const mockResponseData: BiloMediaQueryResponse[] = biloMediaQueryResponseFactory.buildList(2);
				const mediumIds = mockResponseData.map((response: BiloMediaQueryResponse) => response.id);

				const mockAxiosResponse = axiosResponseFactory.build({
					data: mockResponseData,
				}) as AxiosResponse<BiloMediaQueryResponse[]>;

				const decryptedClientSecret = 'client-secret-decrypted';

				jest.spyOn(oauthAdapterService, 'sendTokenRequest').mockResolvedValueOnce(mockToken);
				jest.spyOn(httpService, 'post').mockReturnValueOnce(of(mockAxiosResponse));
				jest.spyOn(encryptionService, 'decrypt').mockReturnValueOnce(decryptedClientSecret);

				const expectedBiloRequestBody = mediumIds.map((id: string) => new BiloMediaQueryBodyParams({ id }));

				return {
					mediumIds,
					mediaSource,
					mockToken,
					mockResponseData,
					expectedBiloRequestBody,
					decryptedClientSecret,
				};
			};

			it('should decrypt the oauth client secret', async () => {
				const { mediumIds, mediaSource } = setup();

				await service.fetchMediaMetadata(mediumIds, mediaSource);

				expect(encryptionService.decrypt).toHaveBeenCalledWith(mediaSource.oauthConfig!.clientSecret);
			});

			it('should call oauth adapter to fetch the oauth token', async () => {
				const { mediumIds, mediaSource, decryptedClientSecret } = setup();

				await service.fetchMediaMetadata(mediumIds, mediaSource);

				expect(oauthAdapterService.sendTokenRequest).toHaveBeenCalledWith(mediaSource.oauthConfig!.authEndpoint, {
					client_id: mediaSource.oauthConfig!.clientId,
					client_secret: decryptedClientSecret,
					grant_type: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
				} as ClientCredentialsGrantTokenRequest);
			});

			it('should call https service with the correct params and headers', async () => {
				const { mediumIds, mediaSource, expectedBiloRequestBody, mockToken } = setup();

				await service.fetchMediaMetadata(mediumIds, mediaSource);
				expect(httpService.post).toHaveBeenCalledWith(
					`${mediaSource.oauthConfig!.baseUrl}/query`,
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
				const { mediumIds, mediaSource, mockResponseData } = setup();

				const result = await service.fetchMediaMetadata(mediumIds, mediaSource);

				expect(result).toEqual(expect.arrayContaining(mockResponseData));
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
	});
});
