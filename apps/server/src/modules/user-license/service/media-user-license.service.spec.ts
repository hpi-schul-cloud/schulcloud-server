import { MediaUserLicense, mediaUserLicenseFactory } from '@modules/user-license';
import { MediaUserLicenseService } from '@modules/user-license/service/media-user-license.service';
import { Test, TestingModule } from '@nestjs/testing';

describe(MediaUserLicenseService.name, () => {
	let module: TestingModule;
	let service: MediaUserLicenseService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [MediaUserLicenseService],
		}).compile();

		service = module.get(MediaUserLicenseService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('hasLicenseForExternalTool', () => {
		describe('when user has license', () => {
			const setup = () => {
				const mediumId = 'mediumId';
				const mediaUserLicenses: MediaUserLicense[] = mediaUserLicenseFactory.buildList(2);
				mediaUserLicenses[0].mediumId = 'mediumId';

				return {
					mediumId,
					mediaUserLicenses,
				};
			};

			it('should return true', () => {
				const { mediumId, mediaUserLicenses } = setup();

				const result = service.hasLicenseForExternalTool(mediumId, mediaUserLicenses);

				expect(result).toEqual(true);
			});
		});

		describe('when user has not the correct license', () => {
			const setup = () => {
				const mediumId = 'mediumId';
				const mediaUserLicenses: MediaUserLicense[] = mediaUserLicenseFactory.buildList(2);

				return {
					mediumId,
					mediaUserLicenses,
				};
			};

			it('should return false', () => {
				const { mediumId, mediaUserLicenses } = setup();

				const result = service.hasLicenseForExternalTool(mediumId, mediaUserLicenses);

				expect(result).toEqual(false);
			});
		});

		describe('when user has no licenses', () => {
			const setup = () => {
				const mediumId = 'mediumId';
				const mediaUserLicenses: MediaUserLicense[] = [];

				return {
					mediumId,
					mediaUserLicenses,
				};
			};

			it('should return false', () => {
				const { mediumId, mediaUserLicenses } = setup();

				const result = service.hasLicenseForExternalTool(mediumId, mediaUserLicenses);

				expect(result).toEqual(false);
			});
		});
	});
});
