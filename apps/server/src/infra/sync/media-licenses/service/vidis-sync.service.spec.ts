import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolForSchoolMediaLicenseSyncNotFoundLoggable } from '@infra/sync/media-licenses/loggable';
import { OfferDTO, SchoolActivationDTO } from '@infra/vidis-client';
import { vidisOfferItemFactory } from '@infra/vidis-client/testing';
import { MediaSource } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { School, SchoolService } from '@modules/school';
import { MediaSchoolLicense, SchoolLicenseType } from '@modules/school-license';
import { MediaSchoolLicenseProps } from '@modules/school-license/domain';
import { MediaSchoolLicenseService } from '@modules/school-license/service/media-school-license.service';
import { schoolFactory } from '@modules/school/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepPartial } from 'fishery';
import { VidisSyncService } from './vidis-sync.service';

describe(VidisSyncService.name, () => {
	let module: TestingModule;
	let service: VidisSyncService;
	let mediaSchoolLicenseService: DeepMocked<MediaSchoolLicenseService>;
	let schoolService: DeepMocked<SchoolService>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VidisSyncService,
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
			],
		}).compile();

		service = module.get(VidisSyncService);
		mediaSchoolLicenseService = module.get(MediaSchoolLicenseService);
		schoolService = module.get(SchoolService);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('syncMediaSchoolLicenses', () => {
		describe('when the vidis media source and activated offer items are given', () => {
			const getAllLicencesFromArgsPassedToSaveAll = (): MediaSchoolLicense[] => {
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
							expect.objectContaining<DeepPartial<MediaSchoolLicenseProps>>({
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
					const { mediaSource, items } = setup();

					await service.syncMediaSchoolLicenses(mediaSource, items);

					expect(mediaSchoolLicenseService.deleteAllByMediaSource).toHaveBeenCalledWith(mediaSource.id);
				});

				it('should save the school activations as new school media licenses', async () => {
					const { mediaSource, items, expectedSavedLicenses } = setup();

					await service.syncMediaSchoolLicenses(mediaSource, items);

					expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).toBeCalledTimes(items.length);
					const allSavedLicenses = getAllLicencesFromArgsPassedToSaveAll();
					expect(allSavedLicenses).toEqual(expect.arrayContaining(expectedSavedLicenses));
				});
			});

			describe('when vidis no longer provides any school activations', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.build();
					const items: OfferDTO[] = [];

					schoolService.getSchoolByOfficialSchoolNumber.mockResolvedValue(null);

					return {
						mediaSource,
						items,
					};
				};

				it('should delete all media school licenses from vidis', async () => {
					const { mediaSource, items } = setup();

					await service.syncMediaSchoolLicenses(mediaSource, items);

					expect(mediaSchoolLicenseService.deleteAllByMediaSource).toHaveBeenCalledWith(mediaSource.id);
				});

				it('should not save any media school licenses', async () => {
					const { mediaSource, items } = setup();

					await service.syncMediaSchoolLicenses(mediaSource, items);

					expect(schoolService.getSchoolByOfficialSchoolNumber).not.toHaveBeenCalled();
					expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).not.toHaveBeenCalled();
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

					schoolService.getSchoolByOfficialSchoolNumber.mockResolvedValue(null);

					return {
						mediaSource,
						items,
						missingSchoolNumbers,
					};
				};

				it('should log a SchoolForSchoolMediaLicenseSyncNotFoundLoggable', async () => {
					const { mediaSource, items, missingSchoolNumbers } = setup();

					await service.syncMediaSchoolLicenses(mediaSource, items);

					missingSchoolNumbers.forEach((schoolActivation: SchoolActivationDTO) => {
						expect(logger.info).toHaveBeenCalledWith(
							new SchoolForSchoolMediaLicenseSyncNotFoundLoggable(schoolActivation.regionName)
						);
					});
				});

				it('should not save any media school licenses', async () => {
					const { mediaSource, items } = setup();

					await service.syncMediaSchoolLicenses(mediaSource, items);

					expect(schoolService.getSchoolByOfficialSchoolNumber).toHaveBeenCalled();
					expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).not.toHaveBeenCalled();
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
					const { mediaSource, items, expectedSchoolNumbers } = setup();

					await service.syncMediaSchoolLicenses(mediaSource, items);

					expectedSchoolNumbers.forEach((schoolNumber: string) => {
						expect(schoolService.getSchoolByOfficialSchoolNumber).toBeCalledWith(schoolNumber);
					});
				});

				it('should not throw any error', async () => {
					const { mediaSource, items } = setup();

					const promise = service.syncMediaSchoolLicenses(mediaSource, items);

					await expect(promise).resolves.not.toThrow();
				});

				it('should save the school activations as new school media licenses', async () => {
					const { mediaSource, items, expectedSavedLicenses } = setup();

					await service.syncMediaSchoolLicenses(mediaSource, items);

					expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).toBeCalledTimes(items.length);
					const allSavedLicenses = getAllLicencesFromArgsPassedToSaveAll();
					expect(allSavedLicenses).toEqual(expect.arrayContaining(expectedSavedLicenses));
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
					const { mediaSource, items, expectedSchoolNumbers } = setup();

					await service.syncMediaSchoolLicenses(mediaSource, items);

					expectedSchoolNumbers.forEach((schoolNumber: string) => {
						expect(schoolService.getSchoolByOfficialSchoolNumber).toBeCalledWith(schoolNumber);
					});
				});

				it('should not throw any error', async () => {
					const { mediaSource, items } = setup();

					const promise = service.syncMediaSchoolLicenses(mediaSource, items);

					await expect(promise).resolves.not.toThrow();
				});

				it('should save the school activations as new school media licenses', async () => {
					const { mediaSource, items, expectedSavedLicenses } = setup();

					await service.syncMediaSchoolLicenses(mediaSource, items);

					expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).toBeCalledTimes(items.length);
					const allSavedLicenses = getAllLicencesFromArgsPassedToSaveAll();
					expect(allSavedLicenses).toEqual(expect.arrayContaining(expectedSavedLicenses));
				});
			});

			describe('when the offer item does not has school activations', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.build();
					const schoolActivations = undefined;
					const items: OfferDTO[] = vidisOfferItemFactory.buildList(1, { schoolActivations });

					return {
						mediaSource,
						items,
					};
				};

				it('should skip the offer item', async () => {
					const { mediaSource, items } = setup();

					await service.syncMediaSchoolLicenses(mediaSource, items);

					expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).not.toHaveBeenCalled();
				});
			});

			describe('when the offer item does not has a medium id', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.build();
					const schoolActivations: SchoolActivationDTO[] = [{ date: '01-01-2025', regionName: '00100' }];
					const items: OfferDTO[] = vidisOfferItemFactory.buildList(1, { schoolActivations, offerId: undefined });

					return {
						mediaSource,
						items,
					};
				};

				it('should skip the offer item', async () => {
					const { mediaSource, items } = setup();

					await service.syncMediaSchoolLicenses(mediaSource, items);

					expect(mediaSchoolLicenseService.saveAllMediaSchoolLicenses).not.toHaveBeenCalled();
				});
			});
		});
	});
});
