import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MediaSourceDataFormat } from '@modules/media-source';
import { MediaMetadataSyncService } from '@modules/media-source-sync';
import { mediaSourceSyncReportFactory } from '@modules/media-source-sync/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaMetadataSyncReportLoggable } from '../loggable';
import { MediaMetadataSyncUc } from './media-metadata-sync.uc';

describe(MediaMetadataSyncUc.name, () => {
	let module: TestingModule;
	let uc: MediaMetadataSyncUc;

	let logger: DeepMocked<Logger>;
	let mediaSourceSyncService: DeepMocked<MediaMetadataSyncService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaMetadataSyncUc,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: MediaMetadataSyncService,
					useValue: createMock<MediaMetadataSyncService>(),
				},
			],
		}).compile();

		uc = module.get(MediaMetadataSyncUc);
		logger = module.get(Logger);
		mediaSourceSyncService = module.get(MediaMetadataSyncService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('syncAllMediaMetadata', () => {
		describe('when a media source data format is passed', () => {
			const setup = () => {
				const dataFormat = MediaSourceDataFormat.VIDIS;

				const report = mediaSourceSyncReportFactory.build();

				mediaSourceSyncService.syncAllMediaMetadata.mockResolvedValue(report);

				return { dataFormat, report };
			};

			it('should start the sync of media metadata for bilo', async () => {
				const { dataFormat } = setup();

				await uc.syncAllMediaMetadata(dataFormat);

				expect(mediaSourceSyncService.syncAllMediaMetadata).toBeCalledWith(dataFormat);
			});

			it('should log the report after the bilo media metadata sync', async () => {
				const { dataFormat, report } = setup();

				await uc.syncAllMediaMetadata(dataFormat);

				const loggable = new MediaMetadataSyncReportLoggable(report, dataFormat);
				expect(logger.info).toBeCalledWith(loggable);
			});
		});
	});
});
