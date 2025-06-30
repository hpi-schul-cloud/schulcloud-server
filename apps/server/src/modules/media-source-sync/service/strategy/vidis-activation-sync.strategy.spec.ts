import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OfferDTO, SchoolActivationDTO, VidisClientAdapter } from '@infra/vidis-client';
import { vidisOfferItemFactory } from '@infra/vidis-client/testing';
import { MediaSource, MediaSourceDataFormat, mediaSourceFactory } from '@modules/media-source';
import { School, SchoolService } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { MediaSchoolLicense, MediaSchoolLicenseService, SchoolLicenseType } from '@modules/school-license';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepPartial } from 'fishery';
import { MediaSourceSyncOperationReportFactory, MediaSourceSyncReportFactory } from '../../factory';
import { MediaSourceSyncReport } from '../../interface';
import { SchoolForMediaActivationSyncNotFoundLoggable } from '../../loggable';
import { MediaSourceSyncOperation } from '../../types';
import { VidisActivationSyncStrategy } from './vidis-activation-sync.strategy';

describe(VidisActivationSyncStrategy.name, () => {
	let module: TestingModule;
	let service: VidisActivationSyncStrategy;

	let mediaSchoolLicenseService: DeepMocked<MediaSchoolLicenseService>;
	let schoolService: DeepMocked<SchoolService>;
	let vidisClientAdapter: DeepMocked<VidisClientAdapter>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VidisActivationSyncStrategy,
				{
					provide: MediaSchoolLicenseService,
					useValue: createMock<MediaSchoolLicenseService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: VidisClientAdapter,
					useValue: createMock<VidisClientAdapter>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(VidisActivationSyncStrategy);

		mediaSchoolLicenseService = module.get(MediaSchoolLicenseService);
		schoolService = module.get(SchoolService);
		vidisClientAdapter = module.get(VidisClientAdapter);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getMediaSourceFormat', () => {
		it('should return the vidis media source data format', () => {
			const dataFormat = service.getMediaSourceFormat();

			expect(dataFormat).toEqual(MediaSourceDataFormat.VIDIS);
		});
	});

	describe('syncAllMediaActivations', () => {
		const getAllSavedLicences = (): MediaSchoolLicense[] => {
			const allSavedLicenses = mediaSchoolLicenseService.saveAllMediaSchoolLicenses.mock.calls.reduce<
				MediaSchoolLicense[]
			>((acc: MediaSchoolLicense[], argsPassed: [MediaSchoolLicense[]]) => {
				const licensesArg: MediaSchoolLicense[] = argsPassed[0];
				acc.push(...licensesArg);
				return acc;
			}, []);

			return allSavedLicenses;
		};

		const buildAllLicensesExpectedToBeSaved = (items: OfferDTO[], schools: School[], mediaSource: MediaSource) => {
			const expectedSavedLicenses: unknown[] = [];
			items.forEach((item: OfferDTO) => {
				schools.forEach((school: School) => {
					expectedSavedLicenses.push(
						expect.objectContaining<DeepPartial<MediaSchoolLicense>>({
							type: SchoolLicenseType.MEDIA_LICENSE,
							mediumId: `${item.offerId as number}`,
							schoolId: school.id,
							mediaSource,
						})
					);
				});
			});

			return expectedSavedLicenses;
		};

		const getExpectedSuccessReport = (itemCount: number): MediaSourceSyncReport => {
			const report = MediaSourceSyncReportFactory.buildFromOperations([
				MediaSourceSyncOperationReportFactory.buildWithSuccessStatus(MediaSourceSyncOperation.CREATE, itemCount),
			]);
			return report;
		};

		describe('when there are school activations from vidis', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build();
				const schoolActivations: SchoolActivationDTO[] = [
					{ date: '01-01-2025', regionName: '00100' },
					{ date: '01-01-2025', regionName: '00200' },
				];
				const items: OfferDTO[] = vidisOfferItemFactory.buildList(2, { schoolActivations });

				const schools: School[] = schoolActivations.map((officialSchoolNumber: SchoolActivationDTO) =>
					schoolFactory.build({ officialSchoolNumber: officialSchoolNumber.regionName })
				);

				vidisClientAdapter.getOfferItemsByRegion.mockResolvedValueOnce(items);
				schoolService.getSchoolByOfficialSchoolNumber
					.mockResolvedValueOnce(schools[0])
					.mockResolvedValueOnce(schools[1])
					.mockResolvedValueOnce(schools[0])
					.mockResolvedValueOnce(schools[1]);

				const expectedSavedLicenses = buildAllLicensesExpectedToBeSaved(items, schools, mediaSource);

				return {
					mediaSource,
					items,
					schools,
					expectedSavedLicenses,
				};
			};

			it('should delete all media school licenses from vidis', async () => {
				const { mediaSource } = setup();

				await service.syncAllMediaActivations(mediaSource);

				expect(mediaSchoolLicenseService.deleteAllByMediaSource).toHaveBeenCalledWith(mediaSource.id);
			});

			it('should save the school activations as new school media licenses', async () => {
				const { mediaSource, items, expectedSavedLicenses } = setup();

				await service.syncAllMediaActivations(mediaSource);

				expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).toBeCalledTimes(items.length);
				const allSavedLicenses = getAllSavedLicences();
				expect(allSavedLicenses).toEqual(expect.arrayContaining(expectedSavedLicenses));
			});

			it('should return a success sync report', async () => {
				const { mediaSource, expectedSavedLicenses } = setup();

				const report = await service.syncAllMediaActivations(mediaSource);

				expect(report).toEqual(getExpectedSuccessReport(expectedSavedLicenses.length));
			});
		});

		describe('when vidis no longer provides any school activations', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build();

				vidisClientAdapter.getOfferItemsByRegion.mockResolvedValueOnce([]);
				schoolService.getSchoolByOfficialSchoolNumber.mockResolvedValue(null);

				return {
					mediaSource,
				};
			};

			it('should delete all media school licenses from vidis', async () => {
				const { mediaSource } = setup();

				await service.syncAllMediaActivations(mediaSource);

				expect(mediaSchoolLicenseService.deleteAllByMediaSource).toHaveBeenCalledWith(mediaSource.id);
			});

			it('should not save any media school licenses', async () => {
				const { mediaSource } = setup();

				await service.syncAllMediaActivations(mediaSource);

				expect(schoolService.getSchoolByOfficialSchoolNumber).not.toHaveBeenCalled();
				expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).not.toHaveBeenCalled();
			});

			it('should return a success sync report', async () => {
				const { mediaSource } = setup();

				const report = await service.syncAllMediaActivations(mediaSource);

				expect(report).toEqual(getExpectedSuccessReport(0));
			});
		});

		describe('when a school from the school activations provided could not be found', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build();
				const missingSchoolNumbers: SchoolActivationDTO[] = [
					{ date: '01-01-2025', regionName: '00100' },
					{ date: '01-01-2025', regionName: '00200' },
				];
				const items: OfferDTO[] = vidisOfferItemFactory.buildList(1, { schoolActivations: missingSchoolNumbers });

				vidisClientAdapter.getOfferItemsByRegion.mockResolvedValueOnce(items);
				schoolService.getSchoolByOfficialSchoolNumber.mockResolvedValue(null);

				return {
					mediaSource,
					missingSchoolNumbers,
				};
			};

			it('should log a SchoolForMediaActivationSyncNotFoundLoggable', async () => {
				const { mediaSource, missingSchoolNumbers } = setup();

				await service.syncAllMediaActivations(mediaSource);

				missingSchoolNumbers.forEach((schoolActivation: SchoolActivationDTO) => {
					expect(logger.info).toHaveBeenCalledWith(
						new SchoolForMediaActivationSyncNotFoundLoggable(schoolActivation.regionName)
					);
				});
			});

			it('should not save any media school licenses', async () => {
				const { mediaSource } = setup();

				await service.syncAllMediaActivations(mediaSource);

				expect(schoolService.getSchoolByOfficialSchoolNumber).toHaveBeenCalled();
				expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).not.toHaveBeenCalled();
			});

			it('should return a success sync report', async () => {
				const { mediaSource } = setup();

				const report = await service.syncAllMediaActivations(mediaSource);

				expect(report).toEqual(getExpectedSuccessReport(0));
			});
		});

		describe('when the school activations have the vidis-specific prefix', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory
					.withVidis({
						schoolNumberPrefix: 'DE-NI-',
					})
					.build();
				const schoolActivations: SchoolActivationDTO[] = [
					{ date: '01-01-2025', regionName: 'DE-NI-00100' },
					{ date: '01-01-2025', regionName: 'DE-NI-00200' },
					{ date: '01-01-2025', regionName: 'OTHER-00300' },
				];
				const items: OfferDTO[] = vidisOfferItemFactory.buildList(1, { schoolActivations });

				const expectedSchoolNumbers = ['00100', '00200', 'OTHER-00300'];
				const schools: School[] = expectedSchoolNumbers.map((officialSchoolNumber: string) =>
					schoolFactory.build({ officialSchoolNumber })
				);

				vidisClientAdapter.getOfferItemsByRegion.mockResolvedValueOnce(items);
				schoolService.getSchoolByOfficialSchoolNumber
					.mockResolvedValueOnce(schools[0])
					.mockResolvedValueOnce(schools[1])
					.mockResolvedValueOnce(schools[2]);

				const expectedSavedLicenses = buildAllLicensesExpectedToBeSaved(items, schools, mediaSource);

				return {
					mediaSource,
					items,
					expectedSchoolNumbers,
					expectedSavedLicenses,
				};
			};

			it('should get the correct official school number from the school activations', async () => {
				const { mediaSource, expectedSchoolNumbers } = setup();

				await service.syncAllMediaActivations(mediaSource);

				expectedSchoolNumbers.forEach((schoolNumber: string) => {
					expect(schoolService.getSchoolByOfficialSchoolNumber).toBeCalledWith(schoolNumber);
				});
			});

			it('should not throw any error', async () => {
				const { mediaSource } = setup();

				const promise = service.syncAllMediaActivations(mediaSource);

				await expect(promise).resolves.not.toThrow();
			});

			it('should save the school activations as new school media licenses', async () => {
				const { mediaSource, items, expectedSavedLicenses } = setup();

				await service.syncAllMediaActivations(mediaSource);

				expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).toBeCalledTimes(items.length);
				const allSavedLicenses = getAllSavedLicences();
				expect(allSavedLicenses).toEqual(expect.arrayContaining(expectedSavedLicenses));
			});

			it('should return a success sync report', async () => {
				const { mediaSource, expectedSavedLicenses } = setup();

				const report = await service.syncAllMediaActivations(mediaSource);

				expect(report).toEqual(getExpectedSuccessReport(expectedSavedLicenses.length));
			});
		});

		describe('when the school activations do not have the vidis-specific prefix', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build();
				const schoolActivations: SchoolActivationDTO[] = [
					{ date: '01-01-2025', regionName: '00100' },
					{ date: '01-01-2025', regionName: '00200' },
					{ date: '01-01-2025', regionName: '00300' },
				];
				const items: OfferDTO[] = vidisOfferItemFactory.buildList(1, { schoolActivations });

				const expectedSchoolNumbers = ['00100', '00200', '00300'];
				const schools: School[] = expectedSchoolNumbers.map((officialSchoolNumber: string) =>
					schoolFactory.build({ officialSchoolNumber })
				);

				vidisClientAdapter.getOfferItemsByRegion.mockResolvedValueOnce(items);
				schoolService.getSchoolByOfficialSchoolNumber
					.mockResolvedValueOnce(schools[0])
					.mockResolvedValueOnce(schools[1])
					.mockResolvedValueOnce(schools[2]);

				const expectedSavedLicenses = buildAllLicensesExpectedToBeSaved(items, schools, mediaSource);

				return {
					mediaSource,
					items,
					expectedSchoolNumbers,
					expectedSavedLicenses,
				};
			};

			it('should get the correct official school number from the school activations', async () => {
				const { mediaSource, expectedSchoolNumbers } = setup();

				await service.syncAllMediaActivations(mediaSource);

				expectedSchoolNumbers.forEach((schoolNumber: string) => {
					expect(schoolService.getSchoolByOfficialSchoolNumber).toBeCalledWith(schoolNumber);
				});
			});

			it('should not throw any error', async () => {
				const { mediaSource } = setup();

				const promise = service.syncAllMediaActivations(mediaSource);

				await expect(promise).resolves.not.toThrow();
			});

			it('should save the school activations as new school media licenses', async () => {
				const { mediaSource, items, expectedSavedLicenses } = setup();

				await service.syncAllMediaActivations(mediaSource);

				expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).toBeCalledTimes(items.length);
				const allSavedLicenses = getAllSavedLicences();
				expect(allSavedLicenses).toEqual(expect.arrayContaining(expectedSavedLicenses));
			});

			it('should return a success sync report', async () => {
				const { mediaSource, expectedSavedLicenses } = setup();

				const report = await service.syncAllMediaActivations(mediaSource);

				expect(report).toEqual(getExpectedSuccessReport(expectedSavedLicenses.length));
			});
		});

		describe('when the offer item does not has school activations', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build();
				const schoolActivations = undefined;
				const items: OfferDTO[] = vidisOfferItemFactory.buildList(1, { schoolActivations });

				vidisClientAdapter.getOfferItemsByRegion.mockResolvedValueOnce(items);

				return {
					mediaSource,
					items,
				};
			};

			it('should skip the offer item', async () => {
				const { mediaSource } = setup();

				await service.syncAllMediaActivations(mediaSource);

				expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).not.toHaveBeenCalled();
			});

			it('should return a success sync report', async () => {
				const { mediaSource } = setup();

				const report = await service.syncAllMediaActivations(mediaSource);

				expect(report).toEqual(getExpectedSuccessReport(0));
			});
		});

		describe('when the offer item does not has a medium id', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build();
				const schoolActivations: SchoolActivationDTO[] = [{ date: '01-01-2025', regionName: '00100' }];
				const items: OfferDTO[] = vidisOfferItemFactory.buildList(1, { schoolActivations, offerId: undefined });

				vidisClientAdapter.getOfferItemsByRegion.mockResolvedValueOnce(items);

				return {
					mediaSource,
				};
			};

			it('should skip the offer item', async () => {
				const { mediaSource } = setup();

				await service.syncAllMediaActivations(mediaSource);

				expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).not.toHaveBeenCalled();
			});

			it('should return a success sync report', async () => {
				const { mediaSource } = setup();

				const report = await service.syncAllMediaActivations(mediaSource);

				expect(report).toEqual(getExpectedSuccessReport(0));
			});
		});
	});
});
