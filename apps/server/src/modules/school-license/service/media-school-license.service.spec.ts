import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { MediaSchoolLicenseRepo, MEDIA_SCHOOL_LICENSE_REPO } from '../repo';
import { mediaSchoolLicenseFactory } from '../testing';
import { MediaSchoolLicenseService } from './media-school-license.service';
import { ObjectId } from '@mikro-orm/mongodb';
import { ExternalToolMedium } from '../../tool/external-tool/domain';
import { MediaSchoolLicense } from '../domain';

describe(MediaSchoolLicenseService.name, () => {
	let module: TestingModule;
	let mediaSchoolLicenseService: MediaSchoolLicenseService;
	let mediaSchoolLicenseRepo: DeepMocked<MediaSchoolLicenseRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaSchoolLicenseService,
				{
					provide: MEDIA_SCHOOL_LICENSE_REPO,
					useValue: createMock<MediaSchoolLicenseRepo>(),
				},
			],
		}).compile();

		mediaSchoolLicenseService = module.get(MediaSchoolLicenseService);
		mediaSchoolLicenseRepo = module.get(MEDIA_SCHOOL_LICENSE_REPO);
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
				const medium: ExternalToolMedium = { mediumId: 'mediumId' };
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
				const medium: ExternalToolMedium = { mediumId: 'mediumId' };
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
});
