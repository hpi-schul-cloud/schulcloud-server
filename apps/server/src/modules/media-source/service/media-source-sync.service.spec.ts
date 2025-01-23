import { Test, TestingModule } from '@nestjs/testing';
import { MediaSourceSyncService } from './media-source-sync.service';

describe(MediaSourceSyncService.name, () => {
	let service: MediaSourceSyncService;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [MediaSourceSyncService],
		}).compile();

		service = module.get(MediaSourceSyncService);
	});

	describe('syncAllMediaMetadata', () => {
		it('should return a sync report', async () => {
			const result = await service.syncAllMediaMetadata();

			expect(result).toMatchObject({
				totalCount: 0,
				successCount: 0,
				failedCount: 0,
				undeliveredCount: 0,
				operations: [],
			});
		});
	});
});
