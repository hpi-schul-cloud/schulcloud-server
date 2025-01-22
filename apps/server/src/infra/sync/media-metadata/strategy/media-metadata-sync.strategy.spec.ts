import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MediaSourceSyncService } from '@modules/media-source/service';
import { mediaSourceSyncReportFactory } from '@modules/media-source/testing';
import { SyncStrategyTarget } from '../../sync-strategy.types';
import { MediaMetadataSyncReportLoggable } from '../loggable';
import { MediaMetadataSyncStrategy } from './media-metadata-sync.strategy';

describe(MediaMetadataSyncStrategy.name, () => {
	let module: TestingModule;
	let strategy: MediaMetadataSyncStrategy;
	let syncService: DeepMocked<MediaSourceSyncService>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaMetadataSyncStrategy,
				{
					provide: MediaSourceSyncService,
					useValue: createMock<MediaSourceSyncService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		strategy = module.get(MediaMetadataSyncStrategy);
		syncService = module.get(MediaSourceSyncService);
		logger = module.get(Logger);
	});

	describe('getType', () => {
		describe('when the method is called', () => {
			it('should return the correct sync target', () => {
				const result = strategy.getType();

				expect(result).toEqual(SyncStrategyTarget.MEDIA_METADATA);
			});
		});
	});

	describe('sync', () => {
		describe('when the method is called', () => {
			const setup = () => {
				const report = mediaSourceSyncReportFactory.build();

				syncService.syncAllMediaMetadata.mockResolvedValue(report);

				return { report };
			};

			it('should start the sync for media metadata', async () => {
				setup();

				await strategy.sync();

				expect(syncService.syncAllMediaMetadata).toBeCalled();
			});

			it('should log the report after sync', async () => {
				const { report } = setup();

				await strategy.sync();

				const loggable = new MediaMetadataSyncReportLoggable(report);
				expect(logger.info).toBeCalledWith(loggable);
			});
		});
	});
});
