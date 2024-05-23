import { ExternalToolMedium } from '@modules/tool/external-tool/domain';
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
				const toolMedium: ExternalToolMedium = {
					mediumId: 'mediumId',
					mediaSourceId: 'mediaSourceId',
				};
				const medium = mediaUserLicenseFactory.build({
					mediumId: toolMedium.mediumId,
					mediaSourceId: toolMedium.mediaSourceId,
				});
				const unusedMedium = mediaUserLicenseFactory.build();
				const mediaUserLicenses: MediaUserLicense[] = [medium, unusedMedium];

				return {
					toolMedium,
					mediaUserLicenses,
				};
			};

			it('should return true', () => {
				const { toolMedium, mediaUserLicenses } = setup();

				const result = service.hasLicenseForExternalTool(toolMedium, mediaUserLicenses);

				expect(result).toEqual(true);
			});
		});

		describe('when user has license without sourceId', () => {
			const setup = () => {
				const toolMedium: ExternalToolMedium = {
					mediumId: 'mediumId',
				};
				const medium = mediaUserLicenseFactory.build({
					mediumId: toolMedium.mediumId,
					mediaSourceId: undefined,
				});
				const unusedMedium = mediaUserLicenseFactory.build();
				const mediaUserLicenses: MediaUserLicense[] = [medium, unusedMedium];

				return {
					toolMedium,
					mediaUserLicenses,
				};
			};

			it('should return true', () => {
				const { toolMedium, mediaUserLicenses } = setup();

				const result = service.hasLicenseForExternalTool(toolMedium, mediaUserLicenses);

				expect(result).toEqual(true);
			});
		});

		describe('when user has not the correct license', () => {
			const setup = () => {
				const medium: ExternalToolMedium = { mediumId: 'mediumId' };
				const mediaUserLicenses: MediaUserLicense[] = mediaUserLicenseFactory.buildList(2);

				return {
					medium,
					mediaUserLicenses,
				};
			};

			it('should return false', () => {
				const { medium, mediaUserLicenses } = setup();

				const result = service.hasLicenseForExternalTool(medium, mediaUserLicenses);

				expect(result).toEqual(false);
			});
		});

		describe('when user has no licenses', () => {
			const setup = () => {
				const medium: ExternalToolMedium = { mediumId: 'mediumId' };
				const mediaUserLicenses: MediaUserLicense[] = [];

				return {
					medium,
					mediaUserLicenses,
				};
			};

			it('should return false', () => {
				const { medium, mediaUserLicenses } = setup();

				const result = service.hasLicenseForExternalTool(medium, mediaUserLicenses);

				expect(result).toEqual(false);
			});
		});
	});
});
