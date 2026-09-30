import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { type ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { ExternalToolMediumStatus } from '@modules/tool/external-tool/enum';
import { Test, type TestingModule } from '@nestjs/testing';
import { MEDIA_GROUP_LICENSE_REPO, type MediaGroupLicenseRepo } from '../repo';
import { mediaGroupLicenseFactory } from '../testing';
import { MediaGroupLicenseService } from './media-group-license.service';

describe(MediaGroupLicenseService.name, () => {
	let module: TestingModule;
	let service: MediaGroupLicenseService;
	let mediaGroupLicenseRepo: DeepMocked<MediaGroupLicenseRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaGroupLicenseService,
				{
					provide: MEDIA_GROUP_LICENSE_REPO,
					useValue: createMock<MediaGroupLicenseRepo>(),
				},
			],
		}).compile();

		service = module.get(MediaGroupLicenseService);
		mediaGroupLicenseRepo = module.get(MEDIA_GROUP_LICENSE_REPO);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findMediaGroupLicensesByGroupIds', () => {
		it('should return empty array if groupIds is empty', async () => {
			const result = await service.findMediaGroupLicensesByGroupIds([]);
			expect(result).toEqual([]);
			expect(mediaGroupLicenseRepo.findMediaGroupLicensesByGroupIds).not.toHaveBeenCalled();
		});

		it('should call repo and return licenses', async () => {
			const groupId = new ObjectId().toHexString();
			const license = mediaGroupLicenseFactory.build({ groupId });
			mediaGroupLicenseRepo.findMediaGroupLicensesByGroupIds.mockResolvedValue([license]);

			const result = await service.findMediaGroupLicensesByGroupIds([groupId]);

			expect(mediaGroupLicenseRepo.findMediaGroupLicensesByGroupIds).toHaveBeenCalledWith([groupId]);
			expect(result).toEqual([license]);
		});
	});

	describe('findMediaGroupLicensesByGroupId', () => {
		it('should call repo with groupId', async () => {
			const groupId = new ObjectId().toHexString();
			const license = mediaGroupLicenseFactory.build({ groupId });
			mediaGroupLicenseRepo.findMediaGroupLicensesByGroupId.mockResolvedValue([license]);

			const result = await service.findMediaGroupLicensesByGroupId(groupId);

			expect(mediaGroupLicenseRepo.findMediaGroupLicensesByGroupId).toHaveBeenCalledWith(groupId);
			expect(result).toEqual([license]);
		});
	});

	describe('saveAll', () => {
		it('should save media group licenses and return them', async () => {
			const licenses = mediaGroupLicenseFactory.buildList(2);
			mediaGroupLicenseRepo.saveAll.mockResolvedValue(licenses);

			const result = await service.saveAll(licenses);

			expect(mediaGroupLicenseRepo.saveAll).toHaveBeenCalledWith(licenses);
			expect(result).toEqual(licenses);
		});
	});

	describe('delete', () => {
		it('should call repo delete', async () => {
			const license = mediaGroupLicenseFactory.build();
			await service.delete(license);

			expect(mediaGroupLicenseRepo.delete).toHaveBeenCalledWith(license);
		});
	});

	describe('hasLicenseForExternalTool', () => {
		it('should return true when matching mediumId and mediaSourceId', () => {
			const toolMedium: ExternalToolMedium = {
				status: ExternalToolMediumStatus.ACTIVE,
				mediumId: 'mediumId',
				mediaSourceId: 'mediaSourceId',
			};
			const license = mediaGroupLicenseFactory.build({
				mediumId: toolMedium.mediumId,
				mediaSource: mediaSourceFactory.build({
					sourceId: toolMedium.mediaSourceId,
				}),
			});

			const result = service.hasLicenseForExternalTool(toolMedium, [license]);

			expect(result).toBe(true);
		});

		it('should return false when medium does not match', () => {
			const toolMedium: ExternalToolMedium = {
				status: ExternalToolMediumStatus.ACTIVE,
				mediumId: 'mediumId',
				mediaSourceId: 'mediaSourceId',
			};
			const license = mediaGroupLicenseFactory.build({
				mediumId: 'differentMediumId',
				mediaSource: mediaSourceFactory.build({
					sourceId: toolMedium.mediaSourceId,
				}),
			});

			const result = service.hasLicenseForExternalTool(toolMedium, [license]);

			expect(result).toBe(false);
		});

		it('should return false when license list is empty', () => {
			const toolMedium: ExternalToolMedium = {
				status: ExternalToolMediumStatus.ACTIVE,
				mediumId: 'mediumId',
			};

			const result = service.hasLicenseForExternalTool(toolMedium, []);

			expect(result).toBe(false);
		});
	});
});
