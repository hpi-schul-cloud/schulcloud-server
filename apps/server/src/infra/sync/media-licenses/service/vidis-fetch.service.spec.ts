import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, EncryptionService, SymmetricKeyEncryptionService } from '@infra/encryption';
import { IDMBetreiberApiInterface, PageOfferDTO, VidisClientFactory } from '@infra/vidis-client';
import { MediaSourceDataFormat } from '@modules/media-source';
import { MediaSourceBasicAuthConfig } from '@modules/media-source/domain';
import { MediaSourceBasicAuthConfigNotFoundLoggableException } from '@modules/media-source/loggable';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosErrorFactory, axiosResponseFactory } from '@shared/testing';
import { AxiosErrorLoggable } from '@src/core/error/loggable';
import { AxiosResponse, RawAxiosRequestConfig } from 'axios';
import { vidisPageOfferFactory } from '../testing';
import { VidisFetchService } from './vidis-fetch.service';

describe(VidisFetchService.name, () => {
	let module: TestingModule;
	let service: VidisFetchService;
	let vidisClientFactory: DeepMocked<VidisClientFactory>;
	let encryptionService: DeepMocked<SymmetricKeyEncryptionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VidisFetchService,
				{
					provide: VidisClientFactory,
					useValue: createMock<VidisClientFactory>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>({
						getOrThrow: (key: string) => {
							switch (key) {
								case 'VIDIS_SYNC_REGION':
									return 'test-region';
								default:
									throw new Error(`Unknown key: ${key}`);
							}
						},
					}),
				},
			],
		}).compile();

		service = module.get(VidisFetchService);
		vidisClientFactory = module.get(VidisClientFactory);
		encryptionService = module.get(DefaultEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getOfferItemsFromVidis', () => {
		describe('when the media source has basic auth config', () => {
			describe('when vidis returns the offer items successfully', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBasicAuthConfig().build();

					const axiosResponse = axiosResponseFactory.build({
						data: vidisPageOfferFactory.build(),
					}) as AxiosResponse<PageOfferDTO>;

					const vidisApiClientMock = createMock<IDMBetreiberApiInterface>();
					vidisApiClientMock.getActivatedOffersByRegion.mockResolvedValueOnce(axiosResponse);
					vidisClientFactory.createVidisClient.mockReturnValueOnce(vidisApiClientMock);

					const decryptedUsername = 'un-decrypted';
					const decryptedPassword = 'pw-decrypted';
					encryptionService.decrypt.mockReturnValueOnce(decryptedUsername);
					encryptionService.decrypt.mockReturnValueOnce(decryptedPassword);

					return {
						mediaSource,
						vidisOfferItems: axiosResponse.data.items,
						decryptedUsername,
						decryptedPassword,
						vidisApiClientMock,
					};
				};

				it('should return the vidis offer items', async () => {
					const { mediaSource, vidisOfferItems } = setup();

					const result = await service.getOfferItemsFromVidis(mediaSource);

					expect(result).toEqual(vidisOfferItems);
				});

				it('should decrypt the credentials from basic auth config', async () => {
					const { mediaSource } = setup();

					await service.getOfferItemsFromVidis(mediaSource);

					expect(encryptionService.decrypt).toBeCalledTimes(2);
					expect(encryptionService.decrypt).toBeCalledWith(mediaSource.basicAuthConfig?.username);
					expect(encryptionService.decrypt).toBeCalledWith(mediaSource.basicAuthConfig?.password);
				});

				it('should create a vidis api client', async () => {
					const { mediaSource } = setup();

					await service.getOfferItemsFromVidis(mediaSource);

					expect(vidisClientFactory.createVidisClient).toBeCalledWith();
				});

				it('should call the vidis endpoint for activated offer items with basic auth', async () => {
					const { mediaSource, vidisApiClientMock, decryptedUsername, decryptedPassword } = setup();

					await service.getOfferItemsFromVidis(mediaSource);

					const encodedBasicAuth = btoa(`${decryptedUsername}:${decryptedPassword}`);
					const expectedAxiosOptions: RawAxiosRequestConfig = {
						headers: { Authorization: expect.stringMatching(`Basic ${encodedBasicAuth}`) as string },
					};

					expect(vidisApiClientMock.getActivatedOffersByRegion).toBeCalledWith(
						'test-region',
						undefined,
						undefined,
						expectedAxiosOptions
					);
				});
			});

			describe('when vidis returns the no offer items', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBasicAuthConfig().build();

					const axiosResponse = axiosResponseFactory.build({
						data: vidisPageOfferFactory.build({ items: undefined }),
					}) as AxiosResponse<PageOfferDTO>;

					const vidisApiClientMock = createMock<IDMBetreiberApiInterface>();
					vidisApiClientMock.getActivatedOffersByRegion.mockResolvedValueOnce(axiosResponse);
					vidisClientFactory.createVidisClient.mockReturnValueOnce(vidisApiClientMock);

					const basicAuth = mediaSource.basicAuthConfig as MediaSourceBasicAuthConfig;
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.username);
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.password);

					return {
						mediaSource,
					};
				};

				it('should return an empty array', async () => {
					const { mediaSource } = setup();

					const result = await service.getOfferItemsFromVidis(mediaSource);

					expect(result.length).toEqual(0);
				});
			});

			describe('when an axios error is thrown', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBasicAuthConfig().build();

					const axiosError = axiosErrorFactory.build();

					const vidisApiClientMock = createMock<IDMBetreiberApiInterface>();
					vidisApiClientMock.getActivatedOffersByRegion.mockRejectedValueOnce(axiosError);
					vidisClientFactory.createVidisClient.mockReturnValueOnce(vidisApiClientMock);

					const basicAuth = mediaSource.basicAuthConfig as MediaSourceBasicAuthConfig;
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.username);
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.password);

					return {
						mediaSource,
						axiosError,
					};
				};

				it('should throw a AxiosErrorLoggable', async () => {
					const { mediaSource, axiosError } = setup();

					const promise = service.getOfferItemsFromVidis(mediaSource);

					await expect(promise).rejects.toThrow(new AxiosErrorLoggable(axiosError, 'VIDIS_GET_OFFER_ITEMS_FAILED'));
				});
			});

			describe('when an unknown error is thrown', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBasicAuthConfig().build();

					const unknownError = new Error();

					const vidisApiClientMock = createMock<IDMBetreiberApiInterface>();
					vidisApiClientMock.getActivatedOffersByRegion.mockRejectedValueOnce(unknownError);
					vidisClientFactory.createVidisClient.mockReturnValueOnce(vidisApiClientMock);

					const basicAuth = mediaSource.basicAuthConfig as MediaSourceBasicAuthConfig;
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.username);
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.password);

					return {
						mediaSource,
						unknownError,
					};
				};

				it('should throw the unknown error', async () => {
					const { mediaSource, unknownError } = setup();

					const promise = service.getOfferItemsFromVidis(mediaSource);

					await expect(promise).rejects.toThrow(unknownError);
				});
			});
		});

		describe('when the media source has no basic auth config ', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build({ basicAuthConfig: undefined });

				return { mediaSource };
			};

			it('should throw an MediaSourceBasicAuthConfigNotFoundLoggableException', async () => {
				const { mediaSource } = setup();

				const promise = service.getOfferItemsFromVidis(mediaSource);

				await expect(promise).rejects.toThrow(
					new MediaSourceBasicAuthConfigNotFoundLoggableException(mediaSource.id, MediaSourceDataFormat.VIDIS)
				);
			});
		});
	});
});
