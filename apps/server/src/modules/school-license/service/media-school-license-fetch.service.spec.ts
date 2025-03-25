import { AxiosErrorLoggable } from '@core/error/loggable';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, EncryptionService, SymmetricKeyEncryptionService } from '@infra/encryption';
import { vidisPageOfferFactory } from '@infra/vidis-client/testing';
import { Configuration, IDMBetreiberApiFactory, IDMBetreiberApiInterface, PageOfferDTO } from '@infra/vidis-client';
import { MediaSourceDataFormat } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosErrorFactory } from '@testing/factory/axios-error.factory';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { AxiosResponse, RawAxiosRequestConfig } from 'axios';
import { MediaSourceVidisConfigNotFoundLoggableException } from '../../media-source/loggable';
import { MediaSchoolLicenseFetchService } from './media-school-license-fetch.service';

jest.mock('@infra/vidis-client/generated/api');

describe(MediaSchoolLicenseFetchService.name, () => {
	let module: TestingModule;
	let service: MediaSchoolLicenseFetchService;

	let encryptionService: DeepMocked<SymmetricKeyEncryptionService>;

	let vidisApi: DeepMocked<IDMBetreiberApiInterface>;
	let apiFactoryMock: jest.Mocked<typeof IDMBetreiberApiFactory>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaSchoolLicenseFetchService,
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();

		service = module.get(MediaSchoolLicenseFetchService);
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

	describe('fetchOffersForSchoolFromVidis', () => {
		describe('when the media source has basic auth config', () => {
			describe('when vidis returns the offer items successfully', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withVidis().build();

					const axiosResponse = axiosResponseFactory.build({
						data: vidisPageOfferFactory.build(),
					}) as AxiosResponse<PageOfferDTO>;

					vidisApi.getActivatedOffersBySchool.mockResolvedValueOnce(axiosResponse);

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
					expect(encryptionService.decrypt).toBeCalledWith(mediaSource.vidisConfig?.username);
					expect(encryptionService.decrypt).toBeCalledWith(mediaSource.vidisConfig?.password);
				});

				it('should create a vidis api client', async () => {
					const { mediaSource, schoolName } = setup();

					await service.fetchOffersForSchoolFromVidis(mediaSource, schoolName);

					expect(apiFactoryMock).toHaveBeenCalledWith(
						new Configuration({
							basePath: mediaSource.vidisConfig?.baseUrl,
						})
					);
				});

				it('should call the vidis endpoint for activated offer items with basic auth', async () => {
					const { mediaSource, decryptedUsername, decryptedPassword, schoolName } = setup();

					await service.fetchOffersForSchoolFromVidis(mediaSource, schoolName);

					const encodedBasicAuth = btoa(`${decryptedUsername}:${decryptedPassword}`);
					const expectedAxiosOptions: RawAxiosRequestConfig = {
						headers: { Authorization: expect.stringMatching(`Basic ${encodedBasicAuth}`) as string },
					};

					expect(vidisApi.getActivatedOffersBySchool).toBeCalledWith(
						'NI_12345',
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

					vidisApi.getActivatedOffersBySchool.mockResolvedValueOnce(axiosResponse);

					encryptionService.decrypt.mockReturnValueOnce('un-decrypted');
					encryptionService.decrypt.mockReturnValueOnce('pw-decrypted');

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
					const mediaSource = mediaSourceFactory.withVidis().build();

					const axiosError = axiosErrorFactory.build();

					vidisApi.getActivatedOffersBySchool.mockRejectedValueOnce(axiosError);

					encryptionService.decrypt.mockReturnValueOnce('un-decrypted');
					encryptionService.decrypt.mockReturnValueOnce('pw-decrypted');

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
					const mediaSource = mediaSourceFactory.withVidis().build();

					const unknownError = new Error();

					vidisApi.getActivatedOffersBySchool.mockRejectedValueOnce(unknownError);

					encryptionService.decrypt.mockReturnValueOnce('un-decrypted');
					encryptionService.decrypt.mockReturnValueOnce('pw-decrypted');

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
				const mediaSource = mediaSourceFactory.build({ format: MediaSourceDataFormat.VIDIS, vidisConfig: undefined });

				const schoolName = 'NI_12345';

				return {
					mediaSource,
					schoolName,
				};
			};

			it('should throw an MediaSourceBasicAuthConfigNotFoundLoggableException', async () => {
				const { mediaSource, schoolName } = setup();

				const promise = service.fetchOffersForSchoolFromVidis(mediaSource, schoolName);

				await expect(promise).rejects.toThrow(
					new MediaSourceVidisConfigNotFoundLoggableException(mediaSource.id, MediaSourceDataFormat.VIDIS)
				);
			});
		});
	});
});
