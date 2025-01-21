import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, EncryptionService, SymmetricKeyEncryptionService } from '@infra/encryption';
import { vidisPageOfferFactory } from '@infra/sync/media-licenses/testing';
import { IDMBetreiberApiInterface, PageOfferDTO, VidisClientFactory } from '@infra/vidis-client';
import { MediaSourceDataFormat } from '@modules/media-source';
import { MediaSourceBasicAuthConfig } from '@modules/media-source/domain';
import { MediaSourceBasicAuthConfigNotFoundLoggableException } from '@modules/media-source/loggable';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosErrorLoggable } from '@src/core/error/loggable';
import { axiosErrorFactory } from '@testing/factory/axios-error.factory';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { AxiosResponse, RawAxiosRequestConfig } from 'axios';
import { MediaSchoolLicenseFetchService } from './media-school-license-fetch.service';

describe(MediaSchoolLicenseFetchService.name, () => {
	let module: TestingModule;
	let service: MediaSchoolLicenseFetchService;
	let vidisClientFactory: DeepMocked<VidisClientFactory>;
	let encryptionService: DeepMocked<SymmetricKeyEncryptionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaSchoolLicenseFetchService,
				{
					provide: VidisClientFactory,
					useValue: createMock<VidisClientFactory>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();

		service = module.get(MediaSchoolLicenseFetchService);
		vidisClientFactory = module.get(VidisClientFactory);
		encryptionService = module.get(DefaultEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('fetchOffersForSchoolFromVidis', () => {
		describe('when the media source has basic auth config', () => {
			describe('when vidis returns the offer items successfully', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBasicAuthConfig().build();

					const axiosResponse = axiosResponseFactory.build({
						data: vidisPageOfferFactory.build(),
					}) as AxiosResponse<PageOfferDTO>;

					const vidisApiClientMock = createMock<IDMBetreiberApiInterface>();
					vidisApiClientMock.getActivatedOffersBySchool.mockResolvedValueOnce(axiosResponse);
					vidisClientFactory.createVidisClient.mockReturnValueOnce(vidisApiClientMock);

					const decryptedUsername = 'un-decrypted';
					const decryptedPassword = 'pw-decrypted';
					encryptionService.decrypt.mockReturnValueOnce(decryptedUsername);
					encryptionService.decrypt.mockReturnValueOnce(decryptedPassword);

					const schoolName = 'NI_12345';

					return {
						mediaSource,
						vidisOfferItems: axiosResponse.data.items,
						decryptedUsername,
						decryptedPassword,
						vidisApiClientMock,
						schoolName,
					};
				};

				it('should return the vidis offer items', async () => {
					const { mediaSource, vidisOfferItems, schoolName } = setup();

					const result = await service.fetchOffersForSchoolFromVidis(mediaSource, schoolName);

					expect(result).toEqual(vidisOfferItems);
				});

				it('should decrypt the credentials from basic auth config', async () => {
					const { mediaSource, schoolName } = setup();

					await service.fetchOffersForSchoolFromVidis(mediaSource, schoolName);

					expect(encryptionService.decrypt).toBeCalledTimes(2);
					expect(encryptionService.decrypt).toBeCalledWith(mediaSource.basicAuthConfig?.username);
					expect(encryptionService.decrypt).toBeCalledWith(mediaSource.basicAuthConfig?.password);
				});

				it('should create a vidis api client', async () => {
					const { mediaSource, schoolName } = setup();

					await service.fetchOffersForSchoolFromVidis(mediaSource, schoolName);

					expect(vidisClientFactory.createVidisClient).toBeCalledWith();
				});

				it('should call the vidis endpoint for activated offer items with basic auth', async () => {
					const { mediaSource, vidisApiClientMock, decryptedUsername, decryptedPassword, schoolName } = setup();

					await service.fetchOffersForSchoolFromVidis(mediaSource, schoolName);

					const encodedBasicAuth = btoa(`${decryptedUsername}:${decryptedPassword}`);
					const expectedAxiosOptions: RawAxiosRequestConfig = {
						headers: { Authorization: expect.stringMatching(`Basic ${encodedBasicAuth}`) as string },
					};

					expect(vidisApiClientMock.getActivatedOffersBySchool).toBeCalledWith(
						'NI_12345',
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
					vidisApiClientMock.getActivatedOffersBySchool.mockResolvedValueOnce(axiosResponse);
					vidisClientFactory.createVidisClient.mockReturnValueOnce(vidisApiClientMock);

					const basicAuth = mediaSource.basicAuthConfig as MediaSourceBasicAuthConfig;
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.username);
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.password);

					const schoolName = 'NI_12345';

					return {
						mediaSource,
						schoolName,
					};
				};

				it('should return an empty array', async () => {
					const { mediaSource, schoolName } = setup();

					const result = await service.fetchOffersForSchoolFromVidis(mediaSource, schoolName);

					expect(result.length).toEqual(0);
				});
			});

			describe('when an axios error is thrown', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBasicAuthConfig().build();

					const axiosError = axiosErrorFactory.build();

					const vidisApiClientMock = createMock<IDMBetreiberApiInterface>();
					vidisApiClientMock.getActivatedOffersBySchool.mockRejectedValueOnce(axiosError);
					vidisClientFactory.createVidisClient.mockReturnValueOnce(vidisApiClientMock);

					const basicAuth = mediaSource.basicAuthConfig as MediaSourceBasicAuthConfig;
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.username);
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.password);

					const schoolName = 'NI_12345';

					return {
						mediaSource,
						axiosError,
						schoolName,
					};
				};

				it('should throw a AxiosErrorLoggable', async () => {
					const { mediaSource, axiosError, schoolName } = setup();

					const promise = service.fetchOffersForSchoolFromVidis(mediaSource, schoolName);

					await expect(promise).rejects.toThrow(
						new AxiosErrorLoggable(axiosError, 'VIDIS_GET_OFFER_ITEMS_FOR_SCHOOL_FAILED')
					);
				});
			});

			describe('when an unknown error is thrown', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBasicAuthConfig().build();

					const unknownError = new Error();

					const vidisApiClientMock = createMock<IDMBetreiberApiInterface>();
					vidisApiClientMock.getActivatedOffersBySchool.mockRejectedValueOnce(unknownError);
					vidisClientFactory.createVidisClient.mockReturnValueOnce(vidisApiClientMock);

					const basicAuth = mediaSource.basicAuthConfig as MediaSourceBasicAuthConfig;
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.username);
					encryptionService.decrypt.mockReturnValueOnce(basicAuth.password);

					const schoolName = 'NI_12345';

					return {
						mediaSource,
						unknownError,
						schoolName,
					};
				};

				it('should throw the unknown error', async () => {
					const { mediaSource, unknownError, schoolName } = setup();

					const promise = service.fetchOffersForSchoolFromVidis(mediaSource, schoolName);

					await expect(promise).rejects.toThrow(unknownError);
				});
			});
		});

		describe('when the media source has no basic auth config ', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build({ basicAuthConfig: undefined });

				const schoolName = 'NI_12345';

				return { mediaSource, schoolName };
			};

			it('should throw an MediaSourceBasicAuthConfigNotFoundLoggableException', async () => {
				const { mediaSource, schoolName } = setup();

				const promise = service.fetchOffersForSchoolFromVidis(mediaSource, schoolName);

				await expect(promise).rejects.toThrow(
					new MediaSourceBasicAuthConfigNotFoundLoggableException(mediaSource.id, MediaSourceDataFormat.VIDIS)
				);
			});
		});
	});
});
