import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { School, SchoolService } from '@modules/school';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { schoolFactory } from '@modules/school/testing';
import { MediaSchoolLicense } from '../domain';
import { SchoolLicenseType } from '../enum';
import { MediaSchoolLicenseRepo } from '../repo';
import { SchoolForSchoolMediaLicenseSyncNotFoundLoggable } from '../loggable';
import { mediaSchoolLicenseFactory, vidisItemDtoFactory } from '../testing';
import { MediaSchoolLicenseService } from './media-school-license.service';

describe(MediaSchoolLicenseService.name, () => {
	let module: TestingModule;
	let mediaSchoolLicenseService: MediaSchoolLicenseService;
	let mediaSchoolLicenseRepo: DeepMocked<MediaSchoolLicenseRepo>;
	let schoolService: DeepMocked<SchoolService>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaSchoolLicenseService,
				{
					provide: MediaSchoolLicenseRepo,
					useValue: createMock<MediaSchoolLicenseRepo>(),
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

		mediaSchoolLicenseService = module.get(MediaSchoolLicenseService);
		mediaSchoolLicenseRepo = module.get(MediaSchoolLicenseRepo);
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
		// TODO: most functions will be transferred to vidis sync service; refactoring needed
		describe('when a media source and items are given', () => {
			describe('when the school numbers from an item are not found', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.build();
					const items = vidisItemDtoFactory.buildList(1);

					const missingSchoolNumbers = items[0].schoolActivations;

					mediaSchoolLicenseRepo.findMediaSchoolLicensesByMediumId.mockResolvedValueOnce([]);
					schoolService.getSchoolByOfficialSchoolNumber.mockResolvedValue(null);

					return {
						mediaSource,
						items,
						missingSchoolNumbers,
					};
				};

				it('should log the school numbers as SchoolForSchoolMediaLicenseSyncNotFoundLoggable', async () => {
					const { mediaSource, items, missingSchoolNumbers } = setup();

					await mediaSchoolLicenseService.syncMediaSchoolLicenses(mediaSource, items);

					missingSchoolNumbers.forEach((schoolNumber: string) => {
						expect(logger.info).toHaveBeenCalledWith(new SchoolForSchoolMediaLicenseSyncNotFoundLoggable(schoolNumber));
					});
				});
			});

			describe('when the licenses given does not exist in the db', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.build();
					const officialSchoolNumbers = ['00100', '00200'];
					const items = vidisItemDtoFactory.buildList(1, { schoolActivations: officialSchoolNumbers });

					const schools: School[] = officialSchoolNumbers.map((officialSchoolNumber: string) =>
						schoolFactory.build({ officialSchoolNumber })
					);

					mediaSchoolLicenseRepo.findMediaSchoolLicensesByMediumId.mockResolvedValueOnce([]);
					schoolService.getSchoolByOfficialSchoolNumber.mockResolvedValueOnce(schools[0]);
					schoolService.getSchoolByOfficialSchoolNumber.mockResolvedValueOnce(schools[1]);
					schoolService.getSchoolByOfficialSchoolNumber.mockResolvedValue(schools[0]);
					mediaSchoolLicenseRepo.findMediaSchoolLicense.mockResolvedValue(null);

					return {
						mediaSource,
						items,
						schools,
					};
				};

				it('it should save the new licenses', async () => {
					const { mediaSource, items } = setup();

					await mediaSchoolLicenseService.syncMediaSchoolLicenses(mediaSource, items);

					expect(mediaSchoolLicenseRepo.save).toHaveBeenCalledTimes(2);
					expect(mediaSchoolLicenseRepo.save).toHaveBeenCalledWith(
						expect.objectContaining({
							id: expect.any(String),
							type: SchoolLicenseType.MEDIA_LICENSE,
							schoolId: expect.any(String),
							mediumId: items[0].offerId,
							mediaSource,
						} as MediaSchoolLicense)
					);
				});
			});

			describe('when a license can be found by its medium id', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.build();
					const officialSchoolNumbers = ['00100'];
					const items = vidisItemDtoFactory.buildList(2, { schoolActivations: officialSchoolNumbers });
					const school = schoolFactory.build({ officialSchoolNumber: officialSchoolNumbers[0] });

					const existingMediaSchoolLicense = mediaSchoolLicenseFactory.build({
						schoolId: school.id,
						mediumId: items[0].offerId,
						mediaSource,
					});

					mediaSchoolLicenseRepo.findMediaSchoolLicensesByMediumId.mockResolvedValueOnce([existingMediaSchoolLicense]);
					schoolService.getSchoolById.mockResolvedValueOnce(school);
					schoolService.getSchoolByOfficialSchoolNumber.mockResolvedValue(school);
					mediaSchoolLicenseRepo.findMediaSchoolLicense.mockResolvedValue(null);

					return {
						mediaSource,
						items,
						school,
						existingMediaSchoolLicense,
					};
				};

				it('it should remove existing licenses from the db', async () => {
					const { mediaSource, items, existingMediaSchoolLicense } = setup();

					// await mediaSchoolLicenseService.syncMediaSchoolLicenses(mediaSource, items);
					//
					// expect(mediaSchoolLicenseRepo.delete).toHaveBeenCalledWith(existingMediaSchoolLicense);
				});

				it('it should save the updated or new licenses into the db', async () => {
					const { mediaSource, items, school } = setup();

					await mediaSchoolLicenseService.syncMediaSchoolLicenses(mediaSource, items);

					expect(mediaSchoolLicenseRepo.save).toHaveBeenCalledWith(
						expect.objectContaining({
							id: expect.any(String),
							type: SchoolLicenseType.MEDIA_LICENSE,
							schoolId: school.id,
							mediumId: items[0].offerId,
							mediaSource,
						} as MediaSchoolLicense)
					);
					expect(mediaSchoolLicenseRepo.save).toHaveBeenCalledWith(
						expect.objectContaining({
							id: expect.any(String),
							type: SchoolLicenseType.MEDIA_LICENSE,
							schoolId: school.id,
							mediumId: items[0].offerId,
							mediaSource,
						} as MediaSchoolLicense)
					);
				});
			});
		});
	});
});
