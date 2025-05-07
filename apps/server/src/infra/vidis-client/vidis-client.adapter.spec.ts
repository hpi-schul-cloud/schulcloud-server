import { AxiosErrorLoggable } from '@core/error/loggable';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, EncryptionService, SymmetricKeyEncryptionService } from '@infra/encryption';
import {
	Configuration,
	IDMBetreiberApiFactory,
	IDMBetreiberApiInterface,
	PageOfferDTO,
} from '@infra/vidis-client/index';
import { MediaSourceDataFormat, MediaSourceVidisConfig } from '@modules/media-source';
import { MediaSourceVidisConfigNotFoundLoggableException } from '@modules/media-source/loggable';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosErrorFactory } from '@testing/factory/axios-error.factory';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { AxiosResponse, RawAxiosRequestConfig } from 'axios';
import { vidisPageOfferFactory } from './testing';
import { VidisClientAdapter } from './vidis-client.adapter';

jest.mock('@infra/vidis-client/generated/api');

describe(VidisClientAdapter.name, () => {
	let module: TestingModule;
	let service: VidisClientAdapter;
	let encryptionService: DeepMocked<SymmetricKeyEncryptionService>;

	let vidisApi: DeepMocked<IDMBetreiberApiInterface>;
	let apiFactoryMock: jest.Mocked<typeof IDMBetreiberApiFactory>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VidisClientAdapter,
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();

		service = module.get(VidisClientAdapter);
		encryptionService = module.get(DefaultEncryptionService);

		vidisApi = createMock<IDMBetreiberApiInterface>();
		apiFactoryMock = jest.mocked(IDMBetreiberApiFactory).mockReturnValue(vidisApi);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getOfferItemsByRegion', () => {
		describe('when the media source has basic auth config', () => {
			describe('when vidis returns the offer items successfully', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withVidis().build();

					const axiosResponse = axiosResponseFactory.build({
						data: vidisPageOfferFactory.build(),
					}) as AxiosResponse<PageOfferDTO>;

					vidisApi.getActivatedOffersByRegion.mockResolvedValueOnce(axiosResponse);

					const decryptedUsername = 'un-decrypted';
					const decryptedPassword = 'pw-decrypted';
					encryptionService.decrypt.mockReturnValueOnce(decryptedUsername);
					encryptionService.decrypt.mockReturnValueOnce(decryptedPassword);

					return {
						mediaSource,
						vidisOfferItems: axiosResponse.data.items,
						decryptedUsername,
						decryptedPassword,
					};
				};

				it('should return the vidis offer items', async () => {
					const { mediaSource, vidisOfferItems } = setup();

					const result = await service.getOfferItemsByRegion(mediaSource);

					expect(result).toEqual(vidisOfferItems);
				});

				it('should decrypt the credentials from basic auth config', async () => {
					const { mediaSource } = setup();

					await service.getOfferItemsByRegion(mediaSource);

					expect(encryptionService.decrypt).toBeCalledTimes(2);
					expect(encryptionService.decrypt).toBeCalledWith(mediaSource.vidisConfig?.username);
					expect(encryptionService.decrypt).toBeCalledWith(mediaSource.vidisConfig?.password);
				});

				it('should create a vidis api client', async () => {
					const { mediaSource } = setup();

					await service.getOfferItemsByRegion(mediaSource);

					expect(apiFactoryMock).toHaveBeenCalledWith(
						new Configuration({
							basePath: mediaSource.vidisConfig?.baseUrl,
						})
					);
				});

				it('should call the vidis endpoint for activated offer items with basic auth', async () => {
					const { mediaSource, decryptedUsername, decryptedPassword } = setup();

					await service.getOfferItemsByRegion(mediaSource);

					const encodedBasicAuth = btoa(`${decryptedUsername}:${decryptedPassword}`);
					const expectedAxiosOptions: RawAxiosRequestConfig = {
						headers: { Authorization: expect.stringMatching(`Basic ${encodedBasicAuth}`) as string },
					};

					expect(vidisApi.getActivatedOffersByRegion).toBeCalledWith(
						'test-region',
						undefined,
						undefined,
						expectedAxiosOptions
					);
				});
			});

			describe('when vidis returns the no offer items', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withVidis().build();

					const axiosResponse = axiosResponseFactory.build({
						data: vidisPageOfferFactory.build({ items: undefined }),
					}) as AxiosResponse<PageOfferDTO>;

					vidisApi.getActivatedOffersByRegion.mockResolvedValueOnce(axiosResponse);

					const basicAuth = mediaSource.vidisConfig as MediaSourceVidisConfig;
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.username);
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.password);

					return {
						mediaSource,
					};
				};

				it('should return an empty array', async () => {
					const { mediaSource } = setup();

					const result = await service.getOfferItemsByRegion(mediaSource);

					expect(result.length).toEqual(0);
				});
			});

			describe('when an axios error is thrown', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withVidis().build();

					const axiosError = axiosErrorFactory.build();

					vidisApi.getActivatedOffersByRegion.mockRejectedValueOnce(axiosError);

					const basicAuth = mediaSource.vidisConfig as MediaSourceVidisConfig;
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.username);
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.password);

					return {
						mediaSource,
						axiosError,
					};
				};

				it('should throw a AxiosErrorLoggable', async () => {
					const { mediaSource, axiosError } = setup();

					const promise = service.getOfferItemsByRegion(mediaSource);

					await expect(promise).rejects.toThrow(new AxiosErrorLoggable(axiosError, 'VIDIS_GET_OFFER_ITEMS_FAILED'));
				});
			});

			describe('when an unknown error is thrown', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withVidis().build();

					const unknownError = new Error();

					vidisApi.getActivatedOffersByRegion.mockRejectedValueOnce(unknownError);

					const basicAuth = mediaSource.vidisConfig as MediaSourceVidisConfig;
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.username);
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.password);

					return {
						mediaSource,
						unknownError,
					};
				};

				it('should throw the unknown error', async () => {
					const { mediaSource, unknownError } = setup();

					const promise = service.getOfferItemsByRegion(mediaSource);

					await expect(promise).rejects.toThrow(unknownError);
				});
			});
		});

		describe('when the media source has no basic auth config ', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build({ format: MediaSourceDataFormat.VIDIS, vidisConfig: undefined });

				return { mediaSource };
			};

			it('should throw an MediaSourceVidisNotFoundLoggableException', async () => {
				const { mediaSource } = setup();

				const promise = service.getOfferItemsByRegion(mediaSource);

				await expect(promise).rejects.toThrow(
					new MediaSourceVidisConfigNotFoundLoggableException(mediaSource.id, MediaSourceDataFormat.VIDIS)
				);
			});
		});
	});
});
