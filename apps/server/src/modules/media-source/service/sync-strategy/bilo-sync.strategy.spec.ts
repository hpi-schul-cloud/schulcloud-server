import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExternalToolService } from '@modules/tool';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { MediaSourceDataFormat, MediaSourceSyncOperation, MediaSourceSyncStatus } from '../../enum';
import { mediaSourceFactory, mediaSourceSyncOperationReportFactory, mediaSourceSyncReportFactory } from '../../testing';
import { MediaSourceService } from '../media-source.service';
import { BiloMediaFetchService } from '../bilo-media-fetch.service';
import { BiloSyncStrategy } from './bilo-sync.strategy';

describe(BiloSyncStrategy.name, () => {
	let module: TestingModule;
	let strategy: BiloSyncStrategy;
	let mediaSourceService: DeepMocked<MediaSourceService>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let biloMediaFetchService: DeepMocked<BiloMediaFetchService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BiloSyncStrategy,
				{
					provide: MediaSourceService,
					useValue: createMock<MediaSourceService>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: BiloMediaFetchService,
					useValue: createMock<BiloMediaFetchService>(),
				},
			],
		}).compile();

		strategy = module.get(BiloSyncStrategy);
		mediaSourceService = module.get(MediaSourceService);
		externalToolService = module.get(ExternalToolService);
		biloMediaFetchService = module.get(BiloMediaFetchService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getMediaSourceFormat', () => {
		it('should return the bilo data format', () => {
			const result = strategy.getMediaSourceFormat();

			expect(result).toEqual(MediaSourceDataFormat.BILDUNGSLOGIN);
		});
	});

	describe('syncAllMediaMetadata', () => {
		describe('when there are no external tools with medium from the media source', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withBildungslogin().build();

				mediaSourceService.findByFormat.mockResolvedValueOnce(null);
				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce([]);

				return { mediaSource };
			};

			it('should return an empty report', async () => {
				const { mediaSource } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toEqual({
					totalCount: 0,
					successCount: 0,
					undeliveredCount: 0,
					failedCount: 0,
					operations: [],
				});
			});

			it('should not fetch and sync any media metadata', async () => {
				const { mediaSource } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(biloMediaFetchService.fetchMediaMetadata).not.toBeCalled();
				expect(externalToolService.updateExternalTool).not.toBeCalled();
			});
		});

		describe('when the media from the external tools found had never been synced before', () => {
			describe('when media metadata is fetched and synced successfully', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBildungslogin().build();
					const mediumCount = 5;

					mediaSourceService.findByFormat.mockResolvedValueOnce(null);
					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(
						externalToolFactory
							.withMedium({ mediaSourceId: 'media-source-id', metadataModifiedAt: undefined })
							.buildList(mediumCount)
					);
					// TODO mock fetch service resolved value
					// biloMediaFetchService.fetchMediaMetadata.mockResolvedValueOnce();

					const expectedSyncReport = mediaSourceSyncReportFactory.build({
						totalCount: mediumCount,
						successCount: mediumCount,
						operations: [
							mediaSourceSyncOperationReportFactory.build({
								status: MediaSourceSyncStatus.SUCCESS,
								operation: MediaSourceSyncOperation.CREATE,
								count: mediumCount,
							}),
						],
					});

					return { mediaSource, mediumCount, expectedSyncReport };
				};

				it('should return the correct sync report', async () => {
					const { mediaSource, expectedSyncReport } = setup();

					const result = await strategy.syncAllMediaMetadata(mediaSource);

					expect(result).toEqual(expectedSyncReport);
				});

				it('should update the media metadata', async () => {
					const { mediaSource, mediumCount } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(externalToolService.updateExternalTool).toBeCalledTimes(mediumCount);
				});
			});
		});

		describe('when the media from the external tools had been synced before', () => {
			describe('when the media metadata is outdated', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBildungslogin().build();
					const mediumCount = 5;

					mediaSourceService.findByFormat.mockResolvedValue(null);
					externalToolService.findExternalToolsByMediaSource.mockResolvedValue(
						externalToolFactory
							.withMedium({ mediaSourceId: 'media-source-id', metadataModifiedAt: new Date() })
							.buildList(mediumCount)
					);

					const expectedSyncReport = mediaSourceSyncReportFactory.build({
						totalCount: mediumCount,
						successCount: mediumCount,
						operations: [
							mediaSourceSyncOperationReportFactory.build({
								status: MediaSourceSyncStatus.SUCCESS,
								operation: MediaSourceSyncOperation.CREATE,
								count: mediumCount,
							}),
						],
					});

					return { mediaSource, mediumCount, expectedSyncReport };
				};

				it('should return the correct sync report', async () => {
					const { mediaSource, expectedSyncReport } = setup();

					const result = await strategy.syncAllMediaMetadata(mediaSource);

					expect(result).toEqual(expectedSyncReport);
				});

				it('should update the media metadata', async () => {
					const { mediaSource, mediumCount } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(externalToolService.updateExternalTool).toBeCalledTimes(mediumCount);
				});
			});

			describe('when the fetched metadata is not outdated', () => {});

			describe('when media metadata is fetched and synced successfully', () => {});
		});
	});
});
