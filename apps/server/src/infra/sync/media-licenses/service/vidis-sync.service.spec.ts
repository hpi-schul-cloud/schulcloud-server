import { SchoolForSchoolMediaLicenseSyncNotFoundLoggable } from '@infra/sync/media-licenses/loggable';
import { OfferDTO } from '@infra/vidis-client';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { MediaSchoolLicenseService } from '@modules/school-license/service/media-school-license.service';
import { MediaSchoolLicense, SchoolLicenseType } from '@modules/school-license';
import { mediaSchoolLicenseFactory } from '@modules/school-license/testing';
import { School, SchoolService } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { Logger } from '@src/core/logger';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { vidisOfferItemFactory } from '../testing';
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
		describe('when the vidis media source and school activation items are given', () => {
			describe('when the school activations provided does not exist in SVS', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.build();
					const officialSchoolNumbers = ['00100', '00200'];
					const items: OfferDTO[] = vidisOfferItemFactory.buildList(2, { schoolActivations: officialSchoolNumbers });

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

					await service.syncMediaSchoolLicenses(mediaSource, items);

					expect(mediaSchoolLicenseService.saveMediaSchoolLicense).toHaveBeenCalledTimes(expectedSavedLicenseCount);
					expect(mediaSchoolLicenseService.saveMediaSchoolLicense).toHaveBeenCalledWith(
						expect.objectContaining({
							id: expect.any(String),
							type: SchoolLicenseType.MEDIA_LICENSE,
							schoolId: expect.stringMatching(schoolIdMatch) as string,
							mediumId: `${items[0].offerId as number}`,
							mediaSource,
						} as MediaSchoolLicense)
					);
				});
			});

			describe('when the school activations provided exist in SVS', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.build();
					const officialSchoolNumbers = ['00100'];
					const items: OfferDTO[] = vidisOfferItemFactory.buildList(2, { schoolActivations: officialSchoolNumbers });
					const school = schoolFactory.build({ officialSchoolNumber: officialSchoolNumbers[0] });

					const mediumId = `${items[0].offerId as number}`;
					const existingMediaSchoolLicense = mediaSchoolLicenseFactory.build({
						schoolId: school.id,
						mediumId,
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

					await service.syncMediaSchoolLicenses(mediaSource, items);

					expect(mediaSchoolLicenseService.saveMediaSchoolLicense).not.toHaveBeenCalled();
				});
			});

			describe('when vidis no longer provides school activations for existing media school licenses in SVS', () => {
				describe('when the school has an official school number', () => {
					const setup = () => {
						const mediaSource = mediaSourceFactory.build();
						const items: OfferDTO[] = vidisOfferItemFactory.buildList(2, { schoolActivations: [] });
						const school = schoolFactory.build({ officialSchoolNumber: '00100' });

						const mediumId = `${items[0].offerId as number}`;
						const existingMediaSchoolLicense = mediaSchoolLicenseFactory.build({
							schoolId: school.id,
							mediumId,
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

						await service.syncMediaSchoolLicenses(mediaSource, items);

						expect(mediaSchoolLicenseService.deleteSchoolLicense).toHaveBeenCalledWith(existingMediaSchoolLicense);
					});
				});

				describe('when the school does not have an official school number', () => {
					const setup = () => {
						const mediaSource = mediaSourceFactory.build();
						const items: OfferDTO[] = vidisOfferItemFactory.buildList(2, { schoolActivations: [] });
						const school = schoolFactory.build({ officialSchoolNumber: undefined });

						const mediumId = `${items[0].offerId as number}`;
						const existingMediaSchoolLicense = mediaSchoolLicenseFactory.build({
							schoolId: school.id,
							mediumId,
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

						await service.syncMediaSchoolLicenses(mediaSource, items);

						expect(mediaSchoolLicenseService.deleteSchoolLicense).not.toHaveBeenCalled();
					});
				});
			});

			describe('when a school from the school activations provided could not be found', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.build();
					const missingSchoolNumbers = ['00100', '00200'];
					const items: OfferDTO[] = vidisOfferItemFactory.buildList(1, { schoolActivations: missingSchoolNumbers });

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

					await service.syncMediaSchoolLicenses(mediaSource, items);

					missingSchoolNumbers.forEach((schoolNumber: string) => {
						expect(logger.info).toHaveBeenCalledWith(new SchoolForSchoolMediaLicenseSyncNotFoundLoggable(schoolNumber));
					});
				});
			});

			describe('when the school activations have the vidis-specific prefix', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.build();
					const schoolActivations = ['DE-NI-00100', 'DE-NI-00200', 'DE-NI-00300'];
					const items: OfferDTO[] = vidisOfferItemFactory.buildList(1, { schoolActivations });

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
			});

			describe('when the school activations do not have the vidis-specific prefix', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.build();
					const schoolActivations = ['00100', '00200', '00300'];
					const items: OfferDTO[] = vidisOfferItemFactory.buildList(1, { schoolActivations });

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
			});
		});
	});
});
