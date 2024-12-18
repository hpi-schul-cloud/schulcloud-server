import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MediaSchoolLicenseRepo } from '../repo';
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
					provide: MediaSchoolLicenseRepo,
					useValue: createMock<MediaSchoolLicenseRepo>(),
				},
			],
		}).compile();

		mediaSchoolLicenseService = module.get(MediaSchoolLicenseService);
		mediaSchoolLicenseRepo = module.get(MediaSchoolLicenseRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findMediaSchoolLicensesByMediumId', () => {
		describe('when a medium id of existing media school licenses is given', () => {
			const setup = () => {
				const mediumId = 'test-medium-id';
				const mediaSchooLicenses = mediaSchoolLicenseFactory.buildList(3, { mediumId });

				mediaSchoolLicenseRepo.findMediaSchoolLicensesByMediumId.mockResolvedValueOnce(mediaSchooLicenses);

				return {
					mediumId,
					mediaSchooLicenses,
				};
			};

			it('should find and return the existing media school licenses', async () => {
				const { mediumId, mediaSchooLicenses } = setup();

				const result = await mediaSchoolLicenseService.findMediaSchoolLicensesByMediumId(mediumId);

				expect(result).toEqual(expect.arrayContaining(mediaSchooLicenses));
				expect(mediaSchoolLicenseRepo.findMediaSchoolLicensesByMediumId).toBeCalledWith(mediumId);
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
