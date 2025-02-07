import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MediaSourceService, MediaSourceDataFormat, MediaSourceNotFoundLoggableException } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { MediaSourceSyncStrategy } from '../interface';
import { MediaSourceSyncStrategyNotImplementedLoggableException } from '../loggable';
import { mediaSourceSyncReportFactory } from '../testing';
import { BiloSyncStrategy } from './strategy';
import { MediaSourceSyncService } from './media-source-sync.service';

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

			it('should throw an MediaSourceSyncStrategyNotImplementedLoggableException', async () => {
				const { mediaSourceDataFormat } = setup();

				const promise = service.syncAllMediaMetadata(mediaSourceDataFormat);

				await expect(promise).rejects.toThrow(
					new MediaSourceSyncStrategyNotImplementedLoggableException(mediaSourceDataFormat)
				);
			});
		});
	});
});
