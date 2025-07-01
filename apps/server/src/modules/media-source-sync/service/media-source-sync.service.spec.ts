import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MediaSourceDataFormat, MediaSourceNotFoundLoggableException, MediaSourceService } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaActivationSyncStrategy, MediaMetadataSyncStrategy } from '../interface';
import { SyncStrategyNotImplementedLoggableException } from '../loggable';
import { mediaSourceSyncReportFactory } from '../testing';
import { MediaSourceSyncService } from './media-source-sync.service';
import { BiloMetadataSyncStrategy, VidisActivationSyncStrategy, VidisMetadataSyncStrategy } from './strategy';

describe(MediaSourceSyncService.name, () => {
	let module: TestingModule;
	let service: MediaSourceSyncService;

	let mediaSourceService: DeepMocked<MediaSourceService>;
	let biloMetadataSyncStrategy: DeepMocked<BiloMetadataSyncStrategy>;
	let vidisMetadataSyncStrategy: DeepMocked<VidisMetadataSyncStrategy>;
	let vidisActivationSyncStrategy: DeepMocked<VidisActivationSyncStrategy>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaSourceSyncService,
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
				{
					provide: VidisActivationSyncStrategy,
					useValue: createMock<VidisActivationSyncStrategy>(),
				},
			],
		}).compile();

		service = module.get(MediaSourceSyncService);

		mediaSourceService = module.get(MediaSourceService);
		biloMetadataSyncStrategy = module.get(BiloMetadataSyncStrategy);
		vidisMetadataSyncStrategy = module.get(VidisMetadataSyncStrategy);
		vidisActivationSyncStrategy = module.get(VidisActivationSyncStrategy);
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

					const strategyMap = new Map<MediaSourceDataFormat, MediaMetadataSyncStrategy>([
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

					const strategyMap = new Map<MediaSourceDataFormat, MediaMetadataSyncStrategy>([
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
				const strategyMap = new Map<MediaSourceDataFormat, MediaMetadataSyncStrategy>();
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

	describe('syncAllMediaActivations', () => {
		describe('when a media source data format with sync strategy is passed', () => {
			describe('when the media source can be found', () => {
				const setup = () => {
					const vidisMediaSource = mediaSourceFactory.withVidis().build();
					const report = mediaSourceSyncReportFactory.build();

					vidisActivationSyncStrategy.syncAllMediaActivations.mockResolvedValueOnce(report);
					mediaSourceService.findByFormat.mockResolvedValueOnce(vidisMediaSource);

					const strategyMap = new Map<MediaSourceDataFormat, MediaActivationSyncStrategy>([
						[MediaSourceDataFormat.VIDIS, vidisActivationSyncStrategy],
					]);
					Reflect.set(service, 'activationSyncStrategyMap', strategyMap);

					return { mediaSourceDataFormat: MediaSourceDataFormat.VIDIS, report };
				};

				it('should sync the media activations using the sync strategy', async () => {
					const { mediaSourceDataFormat } = setup();

					await service.syncAllMediaActivations(mediaSourceDataFormat);

					expect(vidisActivationSyncStrategy.syncAllMediaActivations).toBeCalled();
				});

				it('should return a sync report', async () => {
					const { mediaSourceDataFormat, report } = setup();

					const result = await service.syncAllMediaActivations(mediaSourceDataFormat);

					expect(result).toEqual(report);
				});
			});

			describe('when the media source cannot be found', () => {
				const setup = () => {
					const mediaSourceDataFormat = MediaSourceDataFormat.VIDIS;
					const report = mediaSourceSyncReportFactory.build();

					mediaSourceService.findByFormat.mockResolvedValueOnce(null);

					const strategyMap = new Map<MediaSourceDataFormat, MediaActivationSyncStrategy>([
						[MediaSourceDataFormat.VIDIS, vidisActivationSyncStrategy],
					]);
					Reflect.set(service, 'activationSyncStrategyMap', strategyMap);

					return { mediaSourceDataFormat, report };
				};

				it('should throw an MediaSourceNotFoundLoggableException', async () => {
					const { mediaSourceDataFormat } = setup();

					const promise = service.syncAllMediaActivations(mediaSourceDataFormat);

					await expect(promise).rejects.toThrow(new MediaSourceNotFoundLoggableException(mediaSourceDataFormat));
				});
			});
		});

		describe('when a media source has no media activation sync strategy', () => {
			const setup = () => {
				const mediaSourceDataFormat = MediaSourceDataFormat.BILDUNGSLOGIN;

				const strategyMap = new Map<MediaSourceDataFormat, MediaActivationSyncStrategy>([
					[MediaSourceDataFormat.VIDIS, vidisActivationSyncStrategy],
				]);
				Reflect.set(service, 'activationSyncStrategyMap', strategyMap);

				return { mediaSourceDataFormat };
			};

			it('should throw an SyncStrategyNotImplementedLoggableException', async () => {
				const { mediaSourceDataFormat } = setup();

				const promise = service.syncAllMediaActivations(mediaSourceDataFormat);

				await expect(promise).rejects.toThrow(new SyncStrategyNotImplementedLoggableException(mediaSourceDataFormat));
			});
		});
	});
});
