import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExternalTool, ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { ExternalToolService } from '@modules/tool/external-tool/service/external-tool.service';
import { externalToolFactory, externalToolMediumFactory } from '@modules/tool/external-tool/testing';
import { MediaSourceDataFormat, MediaSourceSyncOperation, MediaSourceSyncStatus } from '../../enum';
import {
	biloMediaQueryResponseFactory,
	mediaSourceFactory,
	mediaSourceSyncOperationReportFactory,
	mediaSourceSyncReportFactory,
} from '../../testing';
import { MediaSourceSyncReport } from '../../domain';
import { BiloMediaQueryResponse, BiloLinkResponse } from '../../domain/response';
import { BiloMediaFetchService } from '../bilo-media-fetch.service';
import { BiloSyncStrategy } from './bilo-sync.strategy';

describe(BiloSyncStrategy.name, () => {
	let module: TestingModule;
	let strategy: BiloSyncStrategy;
	let externalToolService: DeepMocked<ExternalToolService>;
	let biloMediaFetchService: DeepMocked<BiloMediaFetchService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BiloSyncStrategy,
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

		describe('when the media metadata from the external tools had never been synced before', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withBildungslogin().build();

				const mediums = externalToolMediumFactory.buildList(5, {
					mediaSourceId: 'media-source-id',
					metadataModifiedAt: undefined,
				});

				const externalTools = mediums.map((medium: ExternalToolMedium) => externalToolFactory.build({ medium }));

				const biloResponse: BiloMediaQueryResponse[] = externalTools.map((externalTool: ExternalTool) =>
					biloMediaQueryResponseFactory.build({
						id: externalTool.medium!.mediumId,
					})
				);

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
				biloMediaFetchService.fetchMediaMetadata.mockResolvedValueOnce(biloResponse);

				const expectedSyncReport: Partial<MediaSourceSyncReport> = {
					totalCount: mediums.length,
					successCount: mediums.length,
					undeliveredCount: 0,
					failedCount: 0,
				};

				const expectedOperations = [
					mediaSourceSyncOperationReportFactory.build({
						status: MediaSourceSyncStatus.SUCCESS,
						operation: MediaSourceSyncOperation.CREATE,
						count: mediums.length,
					}),
				];

				return { mediaSource, mediumCount: mediums.length, expectedSyncReport, expectedOperations };
			};

			it('should return the correct sync report with success status', async () => {
				const { mediaSource, expectedSyncReport, expectedOperations } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toMatchObject(expectedSyncReport);
				expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
			});

			it('should update the media metadata', async () => {
				const { mediaSource, mediumCount } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolService.updateExternalTool).toBeCalledTimes(mediumCount);
			});
		});

		describe('when the media from the external tools had been synced before', () => {
			describe('when the media metadata is outdated', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBildungslogin().build();

					const mediums = externalToolMediumFactory.buildList(5, {
						mediaSourceId: 'media-source-id',
						metadataModifiedAt: new Date(),
					});

					const externalTools = mediums.map((medium: ExternalToolMedium) => externalToolFactory.build({ medium }));

					const biloResponse: BiloMediaQueryResponse[] = externalTools.map((externalTool: ExternalTool) =>
						biloMediaQueryResponseFactory.build({
							id: externalTool.medium!.mediumId,
							modified: Math.trunc(externalTool.medium!.metadataModifiedAt!.getTime() / 1000) + 3600,
						})
					);

					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
					biloMediaFetchService.fetchMediaMetadata.mockResolvedValueOnce(biloResponse);

					const expectedSyncReport: Partial<MediaSourceSyncReport> = {
						totalCount: mediums.length,
						successCount: mediums.length,
						undeliveredCount: 0,
						failedCount: 0,
					};

					const expectedOperations = [
						mediaSourceSyncOperationReportFactory.build({
							status: MediaSourceSyncStatus.SUCCESS,
							operation: MediaSourceSyncOperation.UPDATE,
							count: mediums.length,
						}),
					];

					return { mediaSource, mediumCount: mediums.length, expectedSyncReport, expectedOperations };
				};

				it('should return sync report with success status', async () => {
					const { mediaSource, expectedSyncReport, expectedOperations } = setup();

					const result = await strategy.syncAllMediaMetadata(mediaSource);

					expect(result).toMatchObject(expectedSyncReport);
					expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
				});

				it('should update the media metadata', async () => {
					const { mediaSource, mediumCount } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(externalToolService.updateExternalTool).toBeCalledTimes(mediumCount);
				});
			});

			describe('when the fetched metadata is not outdated', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBildungslogin().build();

					const mediums = externalToolMediumFactory.buildList(5, {
						mediaSourceId: 'media-source-id',
						metadataModifiedAt: new Date(),
					});

					const externalTools = mediums.map((medium: ExternalToolMedium) => externalToolFactory.build({ medium }));

					const biloResponse: BiloMediaQueryResponse[] = externalTools.map((externalTool: ExternalTool) =>
						biloMediaQueryResponseFactory.build({
							id: externalTool.medium!.mediumId,
							title: externalTool.name,
							description: externalTool.description,
							cover: {
								href: externalTool.logoUrl,
								rel: 'src',
							} as BiloLinkResponse,
							modified: Math.trunc(externalTool.medium!.metadataModifiedAt!.getTime() / 1000),
						})
					);

					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
					biloMediaFetchService.fetchMediaMetadata.mockResolvedValueOnce(biloResponse);

					const expectedSyncReport: Partial<MediaSourceSyncReport> = {
						totalCount: mediums.length,
						successCount: mediums.length,
						undeliveredCount: 0,
						failedCount: 0,
					};

					const expectedOperations = [
						mediaSourceSyncOperationReportFactory.build({
							status: MediaSourceSyncStatus.SUCCESS,
							operation: MediaSourceSyncOperation.UPDATE,
							count: mediums.length,
						}),
					];

					return { mediaSource, expectedSyncReport, expectedOperations };
				};

				it('should return sync report with success status', async () => {
					const { mediaSource, expectedSyncReport, expectedOperations } = setup();

					const result = await strategy.syncAllMediaMetadata(mediaSource);

					expect(result).toMatchObject(expectedSyncReport);
					expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
				});

				it('should not update the media metadata', async () => {
					const { mediaSource } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(externalToolService.updateExternalTool).not.toBeCalled();
				});
			});
		});

		describe('when the media source did not deliver all requested metadata', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withBildungslogin().build();

				const mediums = externalToolMediumFactory.buildList(5, {
					mediaSourceId: 'media-source-id',
					metadataModifiedAt: undefined,
				});

				const externalTools = mediums.map((medium: ExternalToolMedium) => externalToolFactory.build({ medium }));

				const biloResponse: BiloMediaQueryResponse[] = [
					biloMediaQueryResponseFactory.build({
						id: externalTools[0].medium!.mediumId,
					}),
				];

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
				biloMediaFetchService.fetchMediaMetadata.mockResolvedValueOnce(biloResponse);

				const expectedSyncReport: Partial<MediaSourceSyncReport> = {
					totalCount: mediums.length,
					successCount: 1,
					undeliveredCount: 4,
					failedCount: 0,
				};

				const expectedOperations = [
					mediaSourceSyncOperationReportFactory.build({
						status: MediaSourceSyncStatus.UNDELIVERED,
						operation: MediaSourceSyncOperation.ANY,
						count: 4,
					}),
					mediaSourceSyncOperationReportFactory.build({
						status: MediaSourceSyncStatus.SUCCESS,
						operation: MediaSourceSyncOperation.CREATE,
						count: 1,
					}),
				];

				return { mediaSource, expectedSyncReport, expectedOperations };
			};

			it('should return sync report with undelivered operations', async () => {
				const { mediaSource, expectedSyncReport, expectedOperations } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toMatchObject(expectedSyncReport);
				expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
			});
		});

		describe('when the media metadata failed to be updated', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withBildungslogin().build();

				const mediums = externalToolMediumFactory.buildList(3, {
					mediaSourceId: 'media-source-id',
					metadataModifiedAt: undefined,
				});

				const externalTools = mediums.map((medium: ExternalToolMedium) => externalToolFactory.build({ medium }));

				const biloResponse: BiloMediaQueryResponse[] = externalTools.map((externalTool: ExternalTool) =>
					biloMediaQueryResponseFactory.build({
						id: externalTool.medium!.mediumId,
					})
				);

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
				biloMediaFetchService.fetchMediaMetadata.mockResolvedValueOnce(biloResponse);

				const mockError = new Error();
				externalToolService.updateExternalTool.mockResolvedValueOnce(externalTools[0]);
				externalToolService.updateExternalTool.mockRejectedValueOnce(mockError);
				externalToolService.updateExternalTool.mockRejectedValueOnce(mockError);

				const expectedSyncReport = mediaSourceSyncReportFactory.build({
					totalCount: mediums.length,
					successCount: 1,
					failedCount: 2,
					operations: [
						mediaSourceSyncOperationReportFactory.build({
							status: MediaSourceSyncStatus.FAILED,
							operation: MediaSourceSyncOperation.ANY,
							count: 2,
						}),
						mediaSourceSyncOperationReportFactory.build({
							status: MediaSourceSyncStatus.SUCCESS,
							operation: MediaSourceSyncOperation.CREATE,
							count: 1,
						}),
					],
				});

				return { mediaSource, expectedSyncReport };
			};

			it('should return sync report with error operations', async () => {
				const { mediaSource, expectedSyncReport } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toEqual(expectedSyncReport);
			});
		});
	});
});
