import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { biloMediaQueryDataResponseFactory } from '@infra/bilo-client/testing';
import { MediaSourceDataFormat, MediaSourceNotFoundLoggableException, MediaSourceService } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaSourceSyncStrategy } from '../interface';
import { SyncStrategyNotImplementedLoggableException } from '../loggable';
import { MediaSourceDataFormatMissingLoggableException } from '../loggable/media-source-data-format-missing-loggable.exception';
import { MediaSourceIdMissingLoggableException } from '../loggable/media-source-id-missing-loggable.exception';
import { MediaMetadataMapper } from '../mapper';
import { mediaSourceSyncReportFactory } from '../testing';
import { MediaSourceSyncService } from './media-source-sync.service';
import { BiloSyncStrategy } from './strategy';

describe(MediaSourceSyncService.name, () => {
	let module: TestingModule;
	let service: MediaSourceSyncService;
	let mediaSourceService: DeepMocked<MediaSourceService>;
	let biloSyncStrategy: DeepMocked<BiloSyncStrategy>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaSourceSyncService,
				{
					provide: MediaSourceService,
					useValue: createMock<MediaSourceService>(),
				},
				{
					provide: BiloSyncStrategy,
					useValue: createMock<BiloSyncStrategy>(),
				},
			],
		}).compile();

		service = module.get(MediaSourceSyncService);
		mediaSourceService = module.get(MediaSourceService);
		biloSyncStrategy = module.get(BiloSyncStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
		jest.clearAllMocks();
	});

	describe('syncAllMediaMetadata', () => {
		describe('when a media source data format with sync strategy is passed', () => {
			describe('when the media source can be found', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBildungslogin().build();
					const report = mediaSourceSyncReportFactory.build();

					biloSyncStrategy.syncAllMediaMetadata.mockResolvedValue(report);
					mediaSourceService.findByFormat.mockResolvedValue(mediaSource);

					const mediaSourceDataFormat = mediaSource.format as MediaSourceDataFormat;

					const strategyMap = new Map<MediaSourceDataFormat, MediaSourceSyncStrategy>([
						[mediaSourceDataFormat, biloSyncStrategy],
					]);
					Reflect.set(service, 'syncStrategyMap', strategyMap);

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

			describe('when the media source cannot be found', () => {
				const setup = () => {
					const mediaSourceDataFormat = MediaSourceDataFormat.BILDUNGSLOGIN;
					const report = mediaSourceSyncReportFactory.build();

					biloSyncStrategy.syncAllMediaMetadata.mockResolvedValue(report);
					mediaSourceService.findByFormat.mockResolvedValue(null);

					const strategyMap = new Map<MediaSourceDataFormat, MediaSourceSyncStrategy>([
						[mediaSourceDataFormat, biloSyncStrategy],
					]);
					Reflect.set(service, 'syncStrategyMap', strategyMap);

					return { mediaSourceDataFormat, report };
				};

				it('should throw an MediaSourceNotFoundLoggableException', async () => {
					const { mediaSourceDataFormat } = setup();

					const promise = service.syncAllMediaMetadata(mediaSourceDataFormat);

					await expect(promise).rejects.toThrow(new MediaSourceNotFoundLoggableException(mediaSourceDataFormat));
				});
			});
		});

		describe('when a media source data format without sync strategy is passed', () => {
			const setup = () => {
				const strategyMap = new Map<MediaSourceDataFormat, MediaSourceSyncStrategy>();
				Reflect.set(service, 'syncStrategyMap', strategyMap);

				const mediaSourceDataFormat = MediaSourceDataFormat.BILDUNGSLOGIN;

				return { mediaSourceDataFormat };
			};

			it('should throw an SyncStrategyNotImplementedLoggableException', async () => {
				const { mediaSourceDataFormat } = setup();

				const promise = service.syncAllMediaMetadata(mediaSourceDataFormat);

				await expect(promise).rejects.toThrow(new SyncStrategyNotImplementedLoggableException(mediaSourceDataFormat));
			});
		});
	});

	describe('fetchMediumMetadata', () => {
		describe('when mediumId, mediaSourceId and a media source data format is passed', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withBildungslogin().build();
				const bilomedia = biloMediaQueryDataResponseFactory.build();
				const mediaMetadata = MediaMetadataMapper.mapToMediaMetadata(bilomedia);

				mediaSourceService.findByFormatAndSourceId.mockResolvedValue(mediaSource);
				biloSyncStrategy.fetchMediaMetadata.mockResolvedValue(mediaMetadata);

				const mediaSourceDataFormat = MediaSourceDataFormat.BILDUNGSLOGIN;

				const strategyMap = new Map<MediaSourceDataFormat, MediaSourceSyncStrategy>([
					[mediaSourceDataFormat, biloSyncStrategy],
				]);
				Reflect.set(service, 'syncStrategyMap', strategyMap);

				return { mediaMetadata, mediaSourceDataFormat };
			};

			it('should fetch the media metadata using the bilo strategy', async () => {
				const { mediaSourceDataFormat } = setup();

				await service.fetchMediumMetadata('mediumId', 'mediaSourceId', mediaSourceDataFormat);

				expect(biloSyncStrategy.fetchMediaMetadata).toBeCalled();
			});
		});

		describe('when the media source data format is missing', () => {
			it('should throw an MediaSourceDataFormatMissingLoggableException', async () => {
				const result = service.fetchMediumMetadata('mediumId', 'mediaSourceId', undefined);

				await expect(result).rejects.toThrow(new MediaSourceDataFormatMissingLoggableException());
			});
		});

		describe('when the media source id is missing', () => {
			it('should throw an MediaSourceIdMissingLoggableException', async () => {
				const result = service.fetchMediumMetadata('mediumId', undefined, MediaSourceDataFormat.BILDUNGSLOGIN);

				await expect(result).rejects.toThrow(
					new MediaSourceIdMissingLoggableException(MediaSourceDataFormat.BILDUNGSLOGIN)
				);
			});
		});

		describe('when the media source cannot be found', () => {
			const setup = () => {
				const mediaSourceDataFormat = MediaSourceDataFormat.BILDUNGSLOGIN;

				mediaSourceService.findByFormatAndSourceId.mockResolvedValue(null);

				return { mediaSourceDataFormat };
			};

			it('should throw an MediaSourceNotFoundLoggableException', async () => {
				const { mediaSourceDataFormat } = setup();

				const result = service.fetchMediumMetadata('mediumId', 'mediaSourceId', mediaSourceDataFormat);

				await expect(result).rejects.toThrow(new MediaSourceNotFoundLoggableException(mediaSourceDataFormat));
			});
		});

		describe('when the sync strategy is not implemented', () => {
			const setup = () => {
				const mediaSourceDataFormat = MediaSourceDataFormat.BILDUNGSLOGIN;

				const mediaSource = mediaSourceFactory.withBildungslogin().build();
				mediaSourceService.findByFormatAndSourceId.mockResolvedValue(mediaSource);

				const strategyMap = new Map<MediaSourceDataFormat, MediaSourceSyncStrategy>();
				Reflect.set(service, 'syncStrategyMap', strategyMap);

				return { mediaSourceDataFormat };
			};

			it('should throw an SyncStrategyNotImplementedLoggableException', async () => {
				const { mediaSourceDataFormat } = setup();

				const result = service.fetchMediumMetadata('mediumId', 'mediaSourceId', mediaSourceDataFormat);

				await expect(result).rejects.toThrow(new SyncStrategyNotImplementedLoggableException(mediaSourceDataFormat));
			});
		});
	});
});
