import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalToolMediumStatus } from '../../tool/external-tool/enum';
import { MediaUserLicense } from '../domain';
import { MediaUserLicenseRepo } from '../repo';
import { mediaUserLicenseFactory } from '../testing';
import { MediaUserLicenseService } from './media-user-license.service';

describe(MediaUserLicenseService.name, () => {
	let module: TestingModule;
	let service: MediaUserLicenseService;

	let mediaUserLicenseRepo: DeepMocked<MediaUserLicenseRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaUserLicenseService,
				{
					provide: MediaUserLicenseRepo,
					useValue: createMock<MediaUserLicenseRepo>(),
				},
			],
		}).compile();

		service = module.get(MediaUserLicenseService);
		mediaUserLicenseRepo = module.get(MediaUserLicenseRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getMediaUserLicensesForUser', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const mediaUserLicense: MediaUserLicense = mediaUserLicenseFactory.build();

			mediaUserLicenseRepo.findMediaUserLicensesForUser.mockResolvedValue([mediaUserLicense]);

			return { userId, mediaUserLicense };
		};

		it('should call user license repo with correct arguments', async () => {
			const { userId } = setup();

			await service.getMediaUserLicensesForUser(userId);

			expect(mediaUserLicenseRepo.findMediaUserLicensesForUser).toHaveBeenCalledWith(userId);
		});

		it('should return media user licenses for user', async () => {
			const { userId, mediaUserLicense } = setup();

			const result: MediaUserLicense[] = await service.getMediaUserLicensesForUser(userId);

			expect(result).toEqual([mediaUserLicense]);
		});
	});

	describe('saveAll', () => {
		describe('when saving media user licenses', () => {
			const setup = () => {
				const mediaUserLicenses = mediaUserLicenseFactory.buildList(2);

				mediaUserLicenseRepo.saveAll.mockResolvedValue(mediaUserLicenses);

				return {
					mediaUserLicenses,
				};
			};

			it('should save the media user licenses', async () => {
				const { mediaUserLicenses } = setup();

				await service.saveAll(mediaUserLicenses);

				expect(mediaUserLicenseRepo.saveAll).toHaveBeenCalledWith(mediaUserLicenses);
			});

			it('should return the media user licenses', async () => {
				const { mediaUserLicenses } = setup();

				const result = await service.saveAll(mediaUserLicenses);

				expect(result).toEqual(mediaUserLicenses);
			});
		});
	});

	describe('deleteUserLicense', () => {
		it('should call user license repo with correct arguments', async () => {
			const mediaUserLicense: MediaUserLicense = mediaUserLicenseFactory.build();

			await service.delete(mediaUserLicense);

			expect(mediaUserLicenseRepo.delete).toHaveBeenCalledWith(mediaUserLicense);
		});
	});

	describe('hasLicenseForExternalTool', () => {
		describe('when user has license', () => {
			const setup = () => {
				const toolMedium: ExternalToolMedium = {
					status: ExternalToolMediumStatus.ACTIVE,
					mediumId: 'mediumId',
					mediaSourceId: 'mediaSourceId',
				};
				const medium = mediaUserLicenseFactory.build({
					mediumId: toolMedium.mediumId,
					mediaSource: mediaSourceFactory.build({
						sourceId: toolMedium.mediaSourceId,
					}),
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
					status: ExternalToolMediumStatus.ACTIVE,
					mediumId: 'mediumId',
				};
				const medium = mediaUserLicenseFactory.build({
					mediumId: toolMedium.mediumId,
					mediaSource: undefined,
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
				const medium: ExternalToolMedium = { status: ExternalToolMediumStatus.ACTIVE, mediumId: 'mediumId' };
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
				const medium: ExternalToolMedium = { status: ExternalToolMediumStatus.ACTIVE, mediumId: 'mediumId' };
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
