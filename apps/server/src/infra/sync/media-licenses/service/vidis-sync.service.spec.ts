import { MediaSourceService, MediaSourceDataFormat } from '@modules/media-source';
import { MediaSourceBasicAuthConfig } from '@modules/media-source/domain';
import {
	MediaSourceBasicAuthConfigNotFoundLoggableException,
	MediaSourceForSyncNotFoundLoggableException,
} from '@modules/media-source/loggable';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { MediaSchoolLicenseService } from '@modules/school-license/service/media-school-license.service';
import { MediaSchoolLicense, SchoolLicenseType } from '@modules/school-license';
import { mediaSchoolLicenseFactory } from '@modules/school-license/testing';
import { SchoolForSchoolMediaLicenseSyncNotFoundLoggable } from '@infra/sync/media-licenses/loggable';
import { School, SchoolService } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { axiosErrorFactory, axiosResponseFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AxiosErrorLoggable } from '@src/core/error/loggable';
import { DefaultEncryptionService, EncryptionService, SymetricKeyEncryptionService } from '@infra/encryption';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { VidisItemResponse, VidisResponse } from '../response';
import { vidisResponseFactory, vidisItemResponseFactory } from '../testing';
import { VidisSyncService } from './vidis-sync.service';

describe(VidisSyncService.name, () => {
	let module: TestingModule;
	let vidisSyncService: VidisSyncService;
	let httpService: DeepMocked<HttpService>;
	let mediaSourceService: DeepMocked<MediaSourceService>;
	let mediaSchoolLicenseService: DeepMocked<MediaSchoolLicenseService>;
	let schoolService: DeepMocked<SchoolService>;
	let logger: DeepMocked<Logger>;
	let encryptionService: DeepMocked<SymetricKeyEncryptionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VidisSyncService,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: MediaSourceService,
					useValue: createMock<MediaSourceService>(),
				},
				{
					provide: MediaSchoolLicenseService,
					useValue: createMock<MediaSchoolLicenseService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();

		vidisSyncService = module.get(VidisSyncService);
		httpService = module.get(HttpService);
		mediaSourceService = module.get(MediaSourceService);
		mediaSchoolLicenseService = module.get(MediaSchoolLicenseService);
		schoolService = module.get(SchoolService);
		logger = module.get(Logger);
		encryptionService = module.get(DefaultEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getVidisMediaSource', () => {
		describe('when the vidis media source exists', () => {
			const setup = () => {
				const vidisMediaSource = mediaSourceFactory.build({ format: MediaSourceDataFormat.VIDIS });

				mediaSourceService.findByFormat.mockResolvedValueOnce(vidisMediaSource);

				return {
					vidisMediaSource,
				};
			};

			it('should find the media source by format', async () => {
				setup();

				await vidisSyncService.getVidisMediaSource();

				expect(mediaSourceService.findByFormat).toBeCalledWith(MediaSourceDataFormat.VIDIS);
			});

			it('should return the vidis media source', async () => {
				const { vidisMediaSource } = setup();

				const result = await vidisSyncService.getVidisMediaSource();

				expect(result).toEqual(vidisMediaSource);
			});
		});

		describe('when the vidis media source does not exist', () => {
			const setup = () => {
				mediaSourceService.findByFormat.mockResolvedValueOnce(null);
			};

			it('should throw an MediaSourceForSyncNotFoundLoggableException', async () => {
				setup();

				const promise = vidisSyncService.getVidisMediaSource();

				await expect(promise).rejects.toThrow(
					new MediaSourceForSyncNotFoundLoggableException(MediaSourceDataFormat.VIDIS)
				);
			});
		});
	});

	describe('getSchoolActivationsFromVidis', () => {
		describe('when the provided media source has a valid basic auth config', () => {
			describe('when vidis successfully returns the school activations', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBasicAuthConfig().build();
					const basicAuthConfig = mediaSource.basicAuthConfig as MediaSourceBasicAuthConfig;

					const vidisItemResponse: VidisItemResponse[] = vidisItemResponseFactory.buildList(3);
					vidisItemResponse[0].offerTitle = 'Other Title';

					const vidisResponse: VidisResponse = vidisResponseFactory.build();
					vidisResponse.items = vidisItemResponse;

					const axiosResponse: AxiosResponse<VidisResponse> = axiosResponseFactory.build({
						data: vidisResponse,
					});

					httpService.get.mockReturnValueOnce(of(axiosResponse));
					encryptionService.decrypt.mockReturnValueOnce(basicAuthConfig.username);
					encryptionService.decrypt.mockReturnValueOnce(basicAuthConfig.password);

					return {
						mediaSource,
						axiosResponse,
					};
				};

				it('should return school activation items from vidis', async () => {
					const { mediaSource, axiosResponse } = setup();

					const result = await vidisSyncService.getSchoolActivationsFromVidis(mediaSource);

					expect(result).toEqual(axiosResponse.data.items);
				});

				it('should decrypt the credentials from the basic auth config', async () => {
					const { mediaSource } = setup();

					await vidisSyncService.getSchoolActivationsFromVidis(mediaSource);

					const basicAuthConfig = mediaSource.basicAuthConfig as MediaSourceBasicAuthConfig;

					expect(encryptionService.decrypt).toBeCalledWith(basicAuthConfig.username);
					expect(encryptionService.decrypt).toBeCalledWith(basicAuthConfig.password);
				});

				it('should call the vidis endpoint for school activations with encoded credentials', async () => {
					const { mediaSource } = setup();

					await vidisSyncService.getSchoolActivationsFromVidis(mediaSource);

					const basicAuthConfig = mediaSource.basicAuthConfig as MediaSourceBasicAuthConfig;
					const endpoint: string = new URL(basicAuthConfig.authEndpoint).toString();
					const unencodedCredentials = `${basicAuthConfig.username}:${basicAuthConfig.password}`;
					const axiosConfig: AxiosRequestConfig = {
						headers: {
							Authorization: expect.not.stringMatching(`Basic ${unencodedCredentials}`) as string,
							'Content-Type': 'application/json',
						},
					};

					expect(httpService.get).toBeCalledWith(endpoint, axiosConfig);
				});
			});

			describe('when there is an axios error when fetching the school activations', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBasicAuthConfig().build();
					const basicAuthConfig = mediaSource.basicAuthConfig as MediaSourceBasicAuthConfig;
					const axiosError: AxiosError = axiosErrorFactory.build();

					httpService.get.mockReturnValueOnce(throwError(() => axiosError));
					encryptionService.decrypt.mockReturnValueOnce(basicAuthConfig.username);
					encryptionService.decrypt.mockReturnValueOnce(basicAuthConfig.password);

					return {
						mediaSource,
						axiosError,
					};
				};

				it('should throw an AxiosErrorLoggable', async () => {
					const { mediaSource, axiosError } = setup();

					const promise = vidisSyncService.getSchoolActivationsFromVidis(mediaSource);

					await expect(promise).rejects.toThrow(
						new AxiosErrorLoggable(axiosError, 'VIDIS_GET_SCHOOL_ACTIVATIONS_FAILED')
					);
				});
			});

			describe('when there is an unknown error when fetching the school activations', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBasicAuthConfig().build();
					const basicAuthConfig = mediaSource.basicAuthConfig as MediaSourceBasicAuthConfig;
					const unknownError = new Error();

					httpService.get.mockReturnValueOnce(throwError(() => unknownError));
					encryptionService.decrypt.mockReturnValueOnce(basicAuthConfig.username);
					encryptionService.decrypt.mockReturnValueOnce(basicAuthConfig.password);

					return {
						mediaSource,
						unknownError,
					};
				};

				it('should throw the unknown error', async () => {
					const { mediaSource, unknownError } = setup();

					const promise = vidisSyncService.getSchoolActivationsFromVidis(mediaSource);

					await expect(promise).rejects.toThrow(unknownError);
				});
			});
		});

		describe('when the provided media source has no basic auth config', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build({ basicAuthConfig: undefined });

				return {
					mediaSource,
				};
			};

			it('should throw an MediaSourceBasicAuthConfigNotFoundLoggableException', async () => {
				const { mediaSource } = setup();

				const promise = vidisSyncService.getSchoolActivationsFromVidis(mediaSource);

				await expect(promise).rejects.toThrow(
					new MediaSourceBasicAuthConfigNotFoundLoggableException(mediaSource.id, MediaSourceDataFormat.VIDIS)
				);
			});
		});
	});

	describe('syncMediaSchoolLicenses', () => {
		describe('when the vidis media source and school activation items are given', () => {
			describe('when the school activations provided does not exist in SVS', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.build();
					const officialSchoolNumbers = ['00100', '00200'];
					const items = vidisItemResponseFactory.buildList(2, { schoolActivations: officialSchoolNumbers });

					const schools: School[] = officialSchoolNumbers.map((officialSchoolNumber: string) =>
						schoolFactory.build({ officialSchoolNumber })
					);

					mediaSchoolLicenseService.findMediaSchoolLicensesByMediumId
						.mockResolvedValueOnce([])
						.mockResolvedValueOnce([]);
					schoolService.getSchoolByOfficialSchoolNumber
						.mockResolvedValueOnce(schools[0])
						.mockResolvedValueOnce(schools[1])
						.mockResolvedValueOnce(schools[0])
						.mockResolvedValueOnce(schools[1]);

					const schoolIdMatch = `/^${schools[0].id}$|^${schools[1].id}$`;
					const expectedSavedLicenseCount = officialSchoolNumbers.length * items.length;

					return {
						mediaSource,
						items,
						schools,
						schoolIdMatch,
						expectedSavedLicenseCount,
					};
				};

				it('should save the school activations as new school media licenses', async () => {
					const { mediaSource, items, schoolIdMatch, expectedSavedLicenseCount } = setup();

					await vidisSyncService.syncMediaSchoolLicenses(mediaSource, items);

					expect(mediaSchoolLicenseService.saveMediaSchoolLicense).toHaveBeenCalledTimes(expectedSavedLicenseCount);
					expect(mediaSchoolLicenseService.saveMediaSchoolLicense).toHaveBeenCalledWith(
						expect.objectContaining({
							id: expect.any(String),
							type: SchoolLicenseType.MEDIA_LICENSE,
							schoolId: expect.stringMatching(schoolIdMatch) as string,
							mediumId: items[0].offerId,
							mediaSource,
						} as MediaSchoolLicense)
					);
				});
			});

			describe('when the school activations provided exist in SVS', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.build();
					const officialSchoolNumbers = ['00100'];
					const items = vidisItemResponseFactory.buildList(2, { schoolActivations: officialSchoolNumbers });
					const school = schoolFactory.build({ officialSchoolNumber: officialSchoolNumbers[0] });

					const existingMediaSchoolLicense = mediaSchoolLicenseFactory.build({
						schoolId: school.id,
						mediumId: items[0].offerId,
						mediaSource,
					});

					mediaSchoolLicenseService.findMediaSchoolLicensesByMediumId.mockResolvedValueOnce([
						existingMediaSchoolLicense,
					]);
					schoolService.getSchoolById.mockResolvedValueOnce(school);
					schoolService.getSchoolByOfficialSchoolNumber.mockResolvedValue(school);

					return {
						mediaSource,
						items,
					};
				};

				it('it should not save the existing school activations as new school media licenses', async () => {
					const { mediaSource, items } = setup();

					await vidisSyncService.syncMediaSchoolLicenses(mediaSource, items);

					expect(mediaSchoolLicenseService.saveMediaSchoolLicense).not.toHaveBeenCalled();
				});
			});

			describe('when vidis no longer provides school activations for existing media school licenses in SVS', () => {
				describe('when the school has an official school number', () => {
					const setup = () => {
						const mediaSource = mediaSourceFactory.build();
						const items = vidisItemResponseFactory.buildList(2, { schoolActivations: [] });
						const school = schoolFactory.build({ officialSchoolNumber: '00100' });

						const existingMediaSchoolLicense = mediaSchoolLicenseFactory.build({
							schoolId: school.id,
							mediumId: items[0].offerId,
							mediaSource,
						});

						mediaSchoolLicenseService.findMediaSchoolLicensesByMediumId.mockResolvedValueOnce([
							existingMediaSchoolLicense,
						]);
						schoolService.getSchoolById.mockResolvedValueOnce(school);
						schoolService.getSchoolByOfficialSchoolNumber.mockResolvedValue(school);

						return {
							mediaSource,
							items,
							existingMediaSchoolLicense,
						};
					};

					it('it should delete the unavailable existing media school licenses', async () => {
						const { mediaSource, items, existingMediaSchoolLicense } = setup();

						await vidisSyncService.syncMediaSchoolLicenses(mediaSource, items);

						expect(mediaSchoolLicenseService.deleteSchoolLicense).toHaveBeenCalledWith(existingMediaSchoolLicense);
					});
				});

				describe('when the school does not have an official school number', () => {
					const setup = () => {
						const mediaSource = mediaSourceFactory.build();
						const items = vidisItemResponseFactory.buildList(2, { schoolActivations: [] });
						const school = schoolFactory.build({ officialSchoolNumber: undefined });

						const existingMediaSchoolLicense = mediaSchoolLicenseFactory.build({
							schoolId: school.id,
							mediumId: items[0].offerId,
							mediaSource,
						});

						mediaSchoolLicenseService.findMediaSchoolLicensesByMediumId.mockResolvedValueOnce([
							existingMediaSchoolLicense,
						]);
						schoolService.getSchoolById.mockResolvedValueOnce(school);
						schoolService.getSchoolByOfficialSchoolNumber.mockResolvedValue(null);

						return {
							mediaSource,
							items,
						};
					};

					it('it should not delete the existing media school licenses', async () => {
						const { mediaSource, items } = setup();

						await vidisSyncService.syncMediaSchoolLicenses(mediaSource, items);

						expect(mediaSchoolLicenseService.deleteSchoolLicense).not.toHaveBeenCalled();
					});
				});
			});

			describe('when a school from the school activations provided could not be found', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.build();
					const missingSchoolNumbers = ['00100', '00200'];
					const items = vidisItemResponseFactory.buildList(1, { schoolActivations: missingSchoolNumbers });

					mediaSchoolLicenseService.findMediaSchoolLicensesByMediumId.mockResolvedValueOnce([]);
					schoolService.getSchoolByOfficialSchoolNumber.mockResolvedValue(null);

					return {
						mediaSource,
						items,
						missingSchoolNumbers,
					};
				};

				it('should log a SchoolForSchoolMediaLicenseSyncNotFoundLoggable', async () => {
					const { mediaSource, items, missingSchoolNumbers } = setup();

					await vidisSyncService.syncMediaSchoolLicenses(mediaSource, items);

					missingSchoolNumbers.forEach((schoolNumber: string) => {
						expect(logger.info).toHaveBeenCalledWith(new SchoolForSchoolMediaLicenseSyncNotFoundLoggable(schoolNumber));
					});
				});
			});

			describe('when the school activations have the vidis-specific prefix', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.build();
					const schoolActivations = ['DE-NI-00100', 'DE-NI-00200', 'DE-NI-00300'];
					const items = vidisItemResponseFactory.buildList(1, { schoolActivations });

					const expectedSchoolNumbers = ['00100', '00200', '00300'];
					const schools: School[] = expectedSchoolNumbers.map((officialSchoolNumber: string) =>
						schoolFactory.build({ officialSchoolNumber })
					);

					mediaSchoolLicenseService.findMediaSchoolLicensesByMediumId.mockResolvedValueOnce([]);
					schoolService.getSchoolByOfficialSchoolNumber
						.mockResolvedValueOnce(schools[0])
						.mockResolvedValueOnce(schools[1])
						.mockResolvedValueOnce(schools[2]);

					return {
						mediaSource,
						items,
						expectedSchoolNumbers,
					};
				};

				it('should get the correct official school number from the school activations', async () => {
					const { mediaSource, items, expectedSchoolNumbers } = setup();

					await vidisSyncService.syncMediaSchoolLicenses(mediaSource, items);

					expectedSchoolNumbers.forEach((schoolNumber: string) => {
						expect(schoolService.getSchoolByOfficialSchoolNumber).toBeCalledWith(schoolNumber);
					});
				});

				it('should not throw any error', async () => {
					const { mediaSource, items } = setup();

					const promise = vidisSyncService.syncMediaSchoolLicenses(mediaSource, items);

					await expect(promise).resolves.not.toThrow();
				});
			});

			describe('when the school activations do not have the vidis-specific prefix', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.build();
					const schoolActivations = ['00100', '00200', '00300'];
					const items = vidisItemResponseFactory.buildList(1, { schoolActivations });

					const expectedSchoolNumbers = ['00100', '00200', '00300'];
					const schools: School[] = expectedSchoolNumbers.map((officialSchoolNumber: string) =>
						schoolFactory.build({ officialSchoolNumber })
					);

					mediaSchoolLicenseService.findMediaSchoolLicensesByMediumId.mockResolvedValueOnce([]);
					schoolService.getSchoolByOfficialSchoolNumber
						.mockResolvedValueOnce(schools[0])
						.mockResolvedValueOnce(schools[1])
						.mockResolvedValueOnce(schools[2]);

					return {
						mediaSource,
						items,
						expectedSchoolNumbers,
					};
				};

				it('should get the correct official school number from the school activations', async () => {
					const { mediaSource, items, expectedSchoolNumbers } = setup();

					await vidisSyncService.syncMediaSchoolLicenses(mediaSource, items);

					expectedSchoolNumbers.forEach((schoolNumber: string) => {
						expect(schoolService.getSchoolByOfficialSchoolNumber).toBeCalledWith(schoolNumber);
					});
				});

				it('should not throw any error', async () => {
					const { mediaSource, items } = setup();

					const promise = vidisSyncService.syncMediaSchoolLicenses(mediaSource, items);

					await expect(promise).resolves.not.toThrow();
				});
			});
		});
	});
});
