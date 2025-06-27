import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MediaSourceDataFormat } from '@modules/media-source';
import { MediaSourceSyncService } from '@modules/media-source-sync';
import { mediaSourceSyncReportFactory } from '@modules/media-source-sync/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaMetadataSyncReportLoggable } from '../loggable';
import { MediaSourceSyncUc } from './media-source-sync.uc';

describe(MediaSourceSyncUc.name, () => {
	let module: TestingModule;
	let uc: MediaSourceSyncUc;

	let logger: DeepMocked<Logger>;
	let mediaSourceSyncService: DeepMocked<MediaSourceSyncService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaSourceSyncUc,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: MediaSourceSyncService,
					useValue: createMock<MediaSourceSyncService>(),
				},
			],
		}).compile();

		uc = module.get(MediaSourceSyncUc);
		logger = module.get(Logger);
		mediaSourceSyncService = module.get(MediaSourceSyncService);
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
				const dataFormat = MediaSourceDataFormat.BILDUNGSLOGIN;

				const report = mediaSourceSyncReportFactory.build();

				mediaSourceSyncService.syncAllMediaMetadata.mockResolvedValue(report);

				return { dataFormat, report };
			};

			it('should start the sync of media metadata', async () => {
				const { dataFormat } = setup();

				await uc.syncAllMediaMetadata(dataFormat);

				expect(mediaSourceSyncService.syncAllMediaMetadata).toBeCalledWith(dataFormat);
			});

			it('should log the report after the media metadata sync', async () => {
				const { dataFormat, report } = setup();

				await uc.syncAllMediaMetadata(dataFormat);

				const loggable = new MediaMetadataSyncReportLoggable(report, dataFormat);
				expect(logger.info).toBeCalledWith(loggable);
			});
		});
	});

	describe('syncAllMediaActivations', () => {
		describe('when a media source data format is passed', () => {
			const setup = () => {
				const dataFormat = MediaSourceDataFormat.VIDIS;

				const report = mediaSourceSyncReportFactory.build();

				mediaSourceSyncService.syncAllMediaActivations.mockResolvedValue(report);

				return { dataFormat, report };
			};

			it('should start the sync of media activations', async () => {
				const { dataFormat } = setup();

				await uc.syncAllMediaMetadata(dataFormat);

				expect(mediaSourceSyncService.syncAllMediaMetadata).toBeCalledWith(dataFormat);
			});

			it('should log the report after the media activations', async () => {
				const { dataFormat, report } = setup();

				await uc.syncAllMediaMetadata(dataFormat);

				const loggable = new MediaMetadataSyncReportLoggable(report, dataFormat);
				expect(logger.info).toBeCalledWith(loggable);
			});
		});
	});
});
