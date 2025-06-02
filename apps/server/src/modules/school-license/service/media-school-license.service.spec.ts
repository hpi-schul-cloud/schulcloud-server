import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { vidisOfferItemFactory } from '@infra/vidis-client/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { MediaSourceDataFormat, MediaSourceService } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { SchoolService } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { ExternalToolMediumStatus } from '@modules/tool/external-tool/enum';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaSchoolLicense } from '../domain';
import { SchoolLicenseType } from '../enum';
import { BuildMediaSchoolLicenseFailedLoggable, SchoolNumberNotFoundLoggableException } from '../loggable';
import { MEDIA_SCHOOL_LICENSE_REPO, MediaSchoolLicenseRepo } from '../repo';
import { mediaSchoolLicenseFactory } from '../testing';
import { MediaSchoolLicenseFetchService } from './media-school-license-fetch.service';
import { MediaSchoolLicenseService } from './media-school-license.service';

describe(MediaSchoolLicenseService.name, () => {
	let module: TestingModule;
	let mediaSchoolLicenseService: MediaSchoolLicenseService;
	let mediaSchoolLicenseRepo: DeepMocked<MediaSchoolLicenseRepo>;
	let schoolService: DeepMocked<SchoolService>;
	let logger: DeepMocked<Logger>;
	let mediaSourceService: DeepMocked<MediaSourceService>;
	let mediaSchoolLicenseFetchService: DeepMocked<MediaSchoolLicenseFetchService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaSchoolLicenseService,
				{
					provide: MEDIA_SCHOOL_LICENSE_REPO,
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
				{
					provide: MediaSourceService,
					useValue: createMock<MediaSourceService>(),
				},
				{
					provide: MediaSchoolLicenseFetchService,
					useValue: createMock<MediaSchoolLicenseFetchService>(),
				},
			],
		}).compile();

		mediaSchoolLicenseService = module.get(MediaSchoolLicenseService);
		mediaSchoolLicenseRepo = module.get(MEDIA_SCHOOL_LICENSE_REPO);
		schoolService = module.get(SchoolService);
		logger = module.get(Logger);
		mediaSourceService = module.get(MediaSourceService);
		mediaSchoolLicenseFetchService = module.get(MediaSchoolLicenseFetchService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('saveAllMediaSchoolLicenses', () => {
		describe('when media school licenses are given', () => {
			const setup = () => {
				const mediaSchooLicenses = mediaSchoolLicenseFactory.buildList(3);

				mediaSchoolLicenseRepo.saveAll.mockResolvedValueOnce(mediaSchooLicenses);

				return {
					mediaSchooLicenses,
				};
			};

			it('should save the media school licenses', async () => {
				const { mediaSchooLicenses } = setup();

				await mediaSchoolLicenseService.saveAllMediaSchoolLicenses(mediaSchooLicenses);

				expect(mediaSchoolLicenseRepo.saveAll).toBeCalledWith(mediaSchooLicenses);
			});

			it('should return the saved media school licenses', async () => {
				const { mediaSchooLicenses } = setup();

				const result = await mediaSchoolLicenseService.saveAllMediaSchoolLicenses(mediaSchooLicenses);

				expect(result.length).toEqual(mediaSchooLicenses.length);
				expect(result).toEqual(mediaSchooLicenses);
			});
		});
	});

	describe('deleteAllByMediaSource', () => {
		describe('when a media source id is given', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build();

				return {
					mediaSource,
				};
			};

			it('should delete the media school license by media source', async () => {
				const { mediaSource } = setup();

				await mediaSchoolLicenseService.deleteAllByMediaSource(mediaSource.id);

				expect(mediaSchoolLicenseRepo.deleteAllByMediaSource).toBeCalledWith(mediaSource.id);
			});
		});
	});

	describe('findMediaSchoolLicensesBySchoolId', () => {
		describe('when media school licenses are found', () => {
			const setup = () => {
				const mediaSchooLicenses = mediaSchoolLicenseFactory.buildList(3);
				const schoolId = new ObjectId().toHexString();

				mediaSchoolLicenseRepo.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce(mediaSchooLicenses);

				return {
					mediaSchooLicenses,
					schoolId,
				};
			};

			it('should call the repo with the correct schholId', async () => {
				const { schoolId } = setup();

				await mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId(schoolId);

				expect(mediaSchoolLicenseRepo.findMediaSchoolLicensesBySchoolId).toBeCalledWith(schoolId);
			});

			it('should return the found media school licenses', async () => {
				const { mediaSchooLicenses, schoolId } = setup();

				const result = await mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId(schoolId);

				expect(result.length).toEqual(mediaSchooLicenses.length);
				expect(result).toEqual(mediaSchooLicenses);
			});
		});

		describe('when media school licenses are not found', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();

				mediaSchoolLicenseRepo.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);

				return {
					schoolId,
				};
			};

			it('should return 0 found media school licenses', async () => {
				const { schoolId } = setup();

				const result = await mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId(schoolId);

				expect(result.length).toEqual(0);
			});
		});
	});

	describe('hasLicenseForExternalTool', () => {
		describe('when school has license', () => {
			const setup = () => {
				const toolMedium: ExternalToolMedium = {
					status: ExternalToolMediumStatus.ACTIVE,
					mediumId: 'mediumId',
					mediaSourceId: 'mediaSourceId',
				};
				const medium = mediaSchoolLicenseFactory.build({
					mediumId: toolMedium.mediumId,
					mediaSource: mediaSourceFactory.build({
						sourceId: toolMedium.mediaSourceId,
					}),
				});
				const unusedMedium = mediaSchoolLicenseFactory.build();
				const mediaUserLicenses: MediaSchoolLicense[] = [medium, unusedMedium];

				return {
					toolMedium,
					mediaUserLicenses,
				};
			};

			it('should return true', () => {
				const { toolMedium, mediaUserLicenses } = setup();

				const result = mediaSchoolLicenseService.hasLicenseForExternalTool(toolMedium, mediaUserLicenses);

				expect(result).toEqual(true);
			});
		});

		describe('when school has license without sourceId', () => {
			const setup = () => {
				const toolMedium: ExternalToolMedium = {
					status: ExternalToolMediumStatus.ACTIVE,
					mediumId: 'mediumId',
				};
				const medium = mediaSchoolLicenseFactory.build({
					mediumId: toolMedium.mediumId,
					mediaSource: undefined,
				});
				const unusedMedium = mediaSchoolLicenseFactory.build();
				const mediaUserLicenses: MediaSchoolLicense[] = [medium, unusedMedium];

				return {
					toolMedium,
					mediaUserLicenses,
				};
			};

			it('should return true', () => {
				const { toolMedium, mediaUserLicenses } = setup();

				const result = mediaSchoolLicenseService.hasLicenseForExternalTool(toolMedium, mediaUserLicenses);

				expect(result).toEqual(true);
			});
		});

		describe('when school has not the correct license', () => {
			const setup = () => {
				const medium: ExternalToolMedium = { status: ExternalToolMediumStatus.ACTIVE, mediumId: 'mediumId' };
				const mediaUserLicenses: MediaSchoolLicense[] = mediaSchoolLicenseFactory.buildList(2);

				return {
					medium,
					mediaUserLicenses,
				};
			};

			it('should return false', () => {
				const { medium, mediaUserLicenses } = setup();

				const result = mediaSchoolLicenseService.hasLicenseForExternalTool(medium, mediaUserLicenses);

				expect(result).toEqual(false);
			});
		});

		describe('when school has no licenses', () => {
			const setup = () => {
				const medium: ExternalToolMedium = { status: ExternalToolMediumStatus.ACTIVE, mediumId: 'mediumId' };
				const mediaUserLicenses: MediaSchoolLicense[] = [];

				return {
					medium,
					mediaUserLicenses,
				};
			};

			it('should return false', () => {
				const { medium, mediaUserLicenses } = setup();

				const result = mediaSchoolLicenseService.hasLicenseForExternalTool(medium, mediaUserLicenses);

				expect(result).toEqual(false);
			});
		});
	});

	describe('deleteAllBySchoolAndMediaSource', () => {
		describe('when school id and  media source id is given', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build();
				const school = schoolFactory.build();

				return {
					mediaSource,
					school,
				};
			};

			it('should delete the media school license by media source', async () => {
				const { mediaSource, school } = setup();

				await mediaSchoolLicenseService.deleteAllBySchoolAndMediaSource(school.id, mediaSource.id);

				expect(mediaSchoolLicenseRepo.deleteAllBySchoolAndMediaSource).toBeCalledWith(school.id, mediaSource.id);
			});
		});
	});

	describe('updateMediaSchoolLicenses', () => {
		describe('when school id is given', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const school = schoolFactory.build({ id: schoolId, officialSchoolNumber: '00100' });
				const mediaSource = mediaSourceFactory.withVidis().build();
				const offersFromMediaSource = vidisOfferItemFactory.buildList(3);

				schoolService.getSchoolById.mockResolvedValue(school);
				mediaSourceService.findByFormat.mockResolvedValue(mediaSource);
				mediaSchoolLicenseFetchService.fetchOffersForSchoolFromVidis.mockResolvedValue(offersFromMediaSource);
				mediaSchoolLicenseRepo.deleteAllBySchoolAndMediaSource.mockImplementation();
				mediaSchoolLicenseRepo.saveAll.mockImplementation();

				return {
					school,
					mediaSource,
					offersFromMediaSource,
				};
			};

			it('should call school service', async () => {
				const { school } = setup();

				await mediaSchoolLicenseService.updateMediaSchoolLicenses(school.id);

				expect(schoolService.getSchoolById).toBeCalledWith(school.id);
			});
		});

		describe('when school with official school number was found ', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const school = schoolFactory.build({ id: schoolId, officialSchoolNumber: '00100' });
				const mediaSource = mediaSourceFactory.withVidis().build();
				const offersFromMediaSource = vidisOfferItemFactory.buildList(3);

				schoolService.getSchoolById.mockResolvedValue(school);
				mediaSourceService.findByFormat.mockResolvedValue(mediaSource);
				mediaSchoolLicenseFetchService.fetchOffersForSchoolFromVidis.mockResolvedValue(offersFromMediaSource);

				return {
					school,
					mediaSource,
					offersFromMediaSource,
				};
			};

			it('should call mediaSourceService', async () => {
				const { school } = setup();

				await mediaSchoolLicenseService.updateMediaSchoolLicenses(school.id);

				expect(mediaSourceService.findByFormat).toBeCalledWith(MediaSourceDataFormat.VIDIS);
			});
		});

		describe('when school without official school number was found ', () => {
			const setup = () => {
				const school = schoolFactory.build({ officialSchoolNumber: undefined });

				schoolService.getSchoolById.mockResolvedValue(school);

				return {
					school,
				};
			};

			it('should throw SchoolNumberNotFoundLoggableException', async () => {
				const { school } = setup();

				await expect(mediaSchoolLicenseService.updateMediaSchoolLicenses(school.id)).rejects.toThrow(
					new SchoolNumberNotFoundLoggableException(school.id)
				);
			});
		});

		describe('when media source was found ', () => {
			const setup = () => {
				const schoolNumberPrefix = 'NI_';
				const officialSchoolNumber = '00100';
				const schoolName = `${schoolNumberPrefix}${officialSchoolNumber}`;

				const school = schoolFactory.build({ officialSchoolNumber });
				const mediaSource = mediaSourceFactory.withVidis({ schoolNumberPrefix }).build();

				schoolService.getSchoolById.mockResolvedValue(school);
				mediaSourceService.findByFormat.mockResolvedValue(mediaSource);

				return {
					school,
					mediaSource,
					schoolName,
				};
			};

			it('should call mediaSchoolLicenseFetchService', async () => {
				const { school, mediaSource, schoolName } = setup();

				await mediaSchoolLicenseService.updateMediaSchoolLicenses(school.id);

				expect(mediaSchoolLicenseFetchService.fetchOffersForSchoolFromVidis).toHaveBeenCalledWith(
					mediaSource,
					schoolName
				);
			});
		});

		describe('when fetching offers from media source was successful', () => {
			const setup = () => {
				const school = schoolFactory.build({ officialSchoolNumber: '00100' });
				const mediaSource = mediaSourceFactory.withVidis().build();
				const offersFromMediaSource = vidisOfferItemFactory.buildList(3);

				schoolService.getSchoolById.mockResolvedValue(school);
				mediaSourceService.findByFormat.mockResolvedValue(mediaSource);
				mediaSchoolLicenseFetchService.fetchOffersForSchoolFromVidis.mockResolvedValue(offersFromMediaSource);
				mediaSchoolLicenseRepo.deleteAllBySchoolAndMediaSource.mockImplementation();
				mediaSchoolLicenseRepo.saveAll.mockImplementation();

				return {
					school,
					mediaSource,
					offersFromMediaSource,
				};
			};

			it('should delete all media school licences by school and media source', async () => {
				const { school, mediaSource } = setup();

				await mediaSchoolLicenseService.updateMediaSchoolLicenses(school.id);

				expect(mediaSchoolLicenseRepo.deleteAllBySchoolAndMediaSource).toHaveBeenCalledWith(school.id, mediaSource.id);
			});
		});

		describe('when fetching offers from media source was successful and offers have an offerId', () => {
			const setup = () => {
				const school = schoolFactory.build({ officialSchoolNumber: '00100' });
				const mediaSource = mediaSourceFactory.withVidis().build();
				const offersFromMediaSource = vidisOfferItemFactory.buildList(5, { offerId: 12345 });
				const mediaSchoolLicenses = mediaSchoolLicenseFactory.buildList(5, {
					type: SchoolLicenseType.MEDIA_LICENSE,
					mediaSource,
					schoolId: school.id,
					mediumId: '12345',
				});

				schoolService.getSchoolById.mockResolvedValue(school);
				mediaSourceService.findByFormat.mockResolvedValue(mediaSource);
				mediaSchoolLicenseFetchService.fetchOffersForSchoolFromVidis.mockResolvedValue(offersFromMediaSource);
				mediaSchoolLicenseRepo.deleteAllBySchoolAndMediaSource.mockImplementation();
				mediaSchoolLicenseRepo.saveAll.mockImplementation();

				return {
					school,
					mediaSource,
					offersFromMediaSource,
					mediaSchoolLicenses,
				};
			};

			it('should save all media school licences', async () => {
				const { school, mediaSchoolLicenses, mediaSource } = setup();

				await mediaSchoolLicenseService.updateMediaSchoolLicenses(school.id);

				expect(mediaSchoolLicenseRepo.saveAll).toHaveBeenCalledWith(
					expect.arrayContaining(
						mediaSchoolLicenses.map((license) =>
							// eslint-disable-next-line @typescript-eslint/no-unsafe-return
							expect.objectContaining({
								...license,
								id: expect.any(String),
								// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
								props: expect.objectContaining({
									id: expect.any(String),
									mediaSource,
									mediumId: mediaSchoolLicenses[0].mediumId,
									schoolId: school.id,
									type: SchoolLicenseType.MEDIA_LICENSE,
								}),
							})
						)
					)
				);
			});
		});

		describe('when fetching offers from media source was successful and offers have no offerId ', () => {
			const setup = () => {
				const school = schoolFactory.build({ officialSchoolNumber: '00100' });
				const mediaSource = mediaSourceFactory.withVidis().build();
				const offersFromMediaSource = vidisOfferItemFactory.buildList(3, { offerId: undefined });

				schoolService.getSchoolById.mockResolvedValue(school);
				mediaSourceService.findByFormat.mockResolvedValue(mediaSource);
				mediaSchoolLicenseFetchService.fetchOffersForSchoolFromVidis.mockResolvedValue(offersFromMediaSource);
				mediaSchoolLicenseRepo.deleteAllBySchoolAndMediaSource.mockImplementation();
				mediaSchoolLicenseRepo.saveAll.mockImplementation();

				return {
					school,
					mediaSource,
					offersFromMediaSource,
				};
			};

			it('should not save media school licenses', async () => {
				const { school } = setup();

				await mediaSchoolLicenseService.updateMediaSchoolLicenses(school.id);

				expect(mediaSchoolLicenseRepo.saveAll).not.toHaveBeenCalled();
			});

			it('should log info that medium id is missing', async () => {
				const { school } = setup();

				await mediaSchoolLicenseService.updateMediaSchoolLicenses(school.id);

				expect(logger.info).toHaveBeenCalledWith(new BuildMediaSchoolLicenseFailedLoggable());
			});
		});
	});
});
