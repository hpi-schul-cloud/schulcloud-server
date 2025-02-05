import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MediaSourceDataFormat } from '../enum';
import { mediaSourceSyncReportFactory } from '../testing';
import { MediaSourceSyncStrategyNotImplementedLoggableException } from '../loggable';
import { BiloSyncStrategy } from '../strategy';
import { MediaSourceSyncService } from './media-source-sync.service';

describe(MediaSourceSyncService.name, () => {
	let module: TestingModule;
	let service: MediaSourceSyncService;
	let biloSyncStrategy: DeepMocked<BiloSyncStrategy>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaSourceSyncService,
				{
					provide: BiloSyncStrategy,
					useValue: createMock<BiloSyncStrategy>(),
				},
			],
		}).compile();

		service = module.get(MediaSourceSyncService);
		biloSyncStrategy = module.get(BiloSyncStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('syncAllMediaMetadata', () => {
		describe('when a media source data format with sync strategy is passed', () => {
			const setup = () => {
				const mediaSourceDataFormat = MediaSourceDataFormat.BILDUNGSLOGIN;

				const report = mediaSourceSyncReportFactory.build();
				biloSyncStrategy.syncAllMediaMetadata.mockResolvedValue(report);

				return { mediaSourceDataFormat, report };
			};

			it('should sync the media metadata using the sync strategy', async () => {
				const { mediaSourceDataFormat } = setup();

				await service.syncAllMediaMetadata(mediaSourceDataFormat);

				expect(biloSyncStrategy.syncAllMediaMetadata).toBeCalled();
			});

			it('should return a sync report', async () => {
				const { mediaSourceDataFormat, report } = setup();

				const result = await service.syncAllMediaMetadata(mediaSourceDataFormat);

				expect(result).toEqual(report);
			});
		});

		describe('when a media source data format without sync strategy is passed', () => {
			it('should throw an MediaSourceSyncStrategyNotImplementedLoggableException', async () => {
				const mediaSourceDataFormat = MediaSourceDataFormat.VIDIS;

				const promise = service.syncAllMediaMetadata(mediaSourceDataFormat);

				await expect(promise).rejects.toThrow(
					new MediaSourceSyncStrategyNotImplementedLoggableException(mediaSourceDataFormat)
				);
			});
		});
	});
});
