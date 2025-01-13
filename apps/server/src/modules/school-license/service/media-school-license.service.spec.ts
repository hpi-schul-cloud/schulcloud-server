import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { MediaSchoolLicenseRepo, MEDIA_SCHOOL_LICENSE_REPO } from '../repo';
import { mediaSchoolLicenseFactory } from '../testing';
import { MediaSchoolLicenseService } from './media-school-license.service';

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
});
