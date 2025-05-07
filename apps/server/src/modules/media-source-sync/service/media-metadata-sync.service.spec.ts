import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MediaSourceDataFormat, MediaSourceNotFoundLoggableException, MediaSourceService } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaSourceSyncStrategy } from '../interface';
import { SyncStrategyNotImplementedLoggableException } from '../loggable';
import { mediaSourceSyncReportFactory } from '../testing';
import { MediaMetadataSyncService } from './media-metadata-sync.service';
import { BiloMetadataSyncStrategy, VidisMetadataSyncStrategy } from './strategy';

describe(MediaMetadataSyncService.name, () => {
	let module: TestingModule;
	let service: MediaMetadataSyncService;
	let mediaSourceService: DeepMocked<MediaSourceService>;
	let biloMetadataSyncStrategy: DeepMocked<BiloMetadataSyncStrategy>;
	let vidisMetadataSyncStrategy: DeepMocked<VidisMetadataSyncStrategy>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaMetadataSyncService,
				{
					provide: MediaSourceService,
					useValue: createMock<MediaSourceService>(),
				},
				{
					provide: BiloMetadataSyncStrategy,
					useValue: createMock<BiloMetadataSyncStrategy>(),
				},
				{
					provide: VidisMetadataSyncStrategy,
					useValue: createMock<VidisMetadataSyncStrategy>(),
				},
			],
		}).compile();

		service = module.get(MediaMetadataSyncService);
		mediaSourceService = module.get(MediaSourceService);
		biloMetadataSyncStrategy = module.get(BiloMetadataSyncStrategy);
		vidisMetadataSyncStrategy = module.get(VidisMetadataSyncStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('syncAllMediaMetadata', () => {
		describe('when a media source data format with sync strategy is passed', () => {
			describe('when the media source can be found', () => {
				const setup = () => {
					const biloMediaSource = mediaSourceFactory.withBildungslogin().build();
					const report = mediaSourceSyncReportFactory.build();

					biloMetadataSyncStrategy.syncAllMediaMetadata.mockResolvedValue(report);
					mediaSourceService.findByFormat.mockResolvedValue(biloMediaSource);

					const strategyMap = new Map<MediaSourceDataFormat, MediaSourceSyncStrategy>([
						[biloMediaSource.format as MediaSourceDataFormat, biloMetadataSyncStrategy],
						[MediaSourceDataFormat.VIDIS, vidisMetadataSyncStrategy],
					]);
					Reflect.set(service, 'metadataSyncStrategyMap', strategyMap);

					return { mediaSourceDataFormat: MediaSourceDataFormat.BILDUNGSLOGIN, report };
				};

				it('should sync the media metadata using the sync strategy', async () => {
					const { mediaSourceDataFormat } = setup();

					await service.syncAllMediaMetadata(mediaSourceDataFormat);

					expect(biloMetadataSyncStrategy.syncAllMediaMetadata).toBeCalled();
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

					biloMetadataSyncStrategy.syncAllMediaMetadata.mockResolvedValue(report);
					mediaSourceService.findByFormat.mockResolvedValue(null);

					const strategyMap = new Map<MediaSourceDataFormat, MediaSourceSyncStrategy>([
						[mediaSourceDataFormat, biloMetadataSyncStrategy],
					]);
					Reflect.set(service, 'metadataSyncStrategyMap', strategyMap);

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
				Reflect.set(service, 'metadataSyncStrategyMap', strategyMap);

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
});
