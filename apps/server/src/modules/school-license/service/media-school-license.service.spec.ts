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

	describe('findAllByMediaSourceAndMediumId', () => {
		describe('when a media source and medium id of existing media school licenses is given', () => {
			const setup = () => {
				const mediumId = 'test-medium-id';
				const mediaSource = mediaSourceFactory.build();
				const mediaSchooLicenses = mediaSchoolLicenseFactory.buildList(3, { mediaSource, mediumId });

				mediaSchoolLicenseRepo.findAllByMediaSourceAndMediumId.mockResolvedValueOnce(mediaSchooLicenses);

				return {
					mediaSource,
					mediumId,
					mediaSchooLicenses,
				};
			};

			it('should find and return the existing media school licenses', async () => {
				const { mediaSource, mediumId, mediaSchooLicenses } = setup();

				const result = await mediaSchoolLicenseService.findAllByMediaSourceAndMediumId(mediaSource.id, mediumId);

				expect(result).toEqual(expect.arrayContaining(mediaSchooLicenses));
				expect(mediaSchoolLicenseRepo.findAllByMediaSourceAndMediumId).toBeCalledWith(mediaSource.id, mediumId);
			});
		});
	});

	describe('saveMediaSchoolLicense', () => {
		describe('when a media school license is given', () => {
			const setup = () => {
				const mediaSchooLicense = mediaSchoolLicenseFactory.build();

				return {
					mediaSchooLicense,
				};
			};

			it('should save the media school license', async () => {
				const { mediaSchooLicense } = setup();

				await mediaSchoolLicenseService.saveMediaSchoolLicense(mediaSchooLicense);

				expect(mediaSchoolLicenseRepo.save).toBeCalledWith(mediaSchooLicense);
			});
		});
	});

	describe('deleteSchoolLicense', () => {
		describe('when an existing media school license is given', () => {
			const setup = () => {
				const mediaSchooLicense = mediaSchoolLicenseFactory.build();

				return {
					mediaSchooLicense,
				};
			};

			it('should delete the media school license', async () => {
				const { mediaSchooLicense } = setup();

				await mediaSchoolLicenseService.deleteSchoolLicense(mediaSchooLicense);

				expect(mediaSchoolLicenseRepo.delete).toBeCalledWith(mediaSchooLicense);
			});
		});
	});
});
