import { ErrorLoggable } from '@core/error/loggable';
import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BiloLinkResponse, BiloMediaClientAdapter, BiloMediaQueryDataResponse } from '@infra/bilo-client';
import { biloMediaQueryDataResponseFactory } from '@infra/bilo-client/testing';
import { MediaSourceDataFormat } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { ExternalToolService } from '@modules/tool';
import { ExternalTool, ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { externalToolFactory, externalToolMediumFactory } from '@modules/tool/external-tool/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaSourceSyncReport } from '../../interface';
import { mediaSourceSyncOperationReportFactory, mediaSourceSyncReportFactory } from '../../testing';
import { MediaSourceSyncOperation, MediaSourceSyncStatus } from '../../types';
import { BiloMetadataSyncStrategy } from './bilo-metadata-sync.strategy';
import { MediaSourceSyncReportFactory } from '@modules/media-source-sync/factory';

describe(BiloMetadataSyncStrategy.name, () => {
	let module: TestingModule;
	let strategy: BiloMetadataSyncStrategy;

	let biloMediaClientAdapter: DeepMocked<BiloMediaClientAdapter>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BiloMetadataSyncStrategy,
				{
					provide: BiloMediaClientAdapter,
					useValue: createMock<BiloMediaClientAdapter>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		strategy = module.get(BiloMetadataSyncStrategy);
		externalToolService = module.get(ExternalToolService);
		biloMediaClientAdapter = module.get(BiloMediaClientAdapter);
		logger = module.get(Logger);
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

				const emptyReport = MediaSourceSyncReportFactory.buildEmptyReport();

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce([]);

				return { mediaSource, emptyReport };
			};

			it('should return an empty report', async () => {
				const { mediaSource, emptyReport } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toEqual(emptyReport);
			});

			it('should not fetch and sync any media metadata', async () => {
				const { mediaSource } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(biloMediaClientAdapter.fetchMediaMetadata).not.toBeCalled();
				expect(externalToolService.updateExternalTools).not.toBeCalled();
			});
		});

		describe('when the media metadata from the external tools had never been synced before', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withBildungslogin().build();

				const mediums = externalToolMediumFactory.buildList(5, {
					mediaSourceId: mediaSource.sourceId,
					metadataModifiedAt: undefined,
				});

				const externalTools = mediums.map((medium: ExternalToolMedium) => externalToolFactory.build({ medium }));

				const metadataItems: BiloMediaQueryDataResponse[] = externalTools.map(
					(_externalTool: ExternalTool, i: number) =>
						biloMediaQueryDataResponseFactory.build({
							id: externalTools[i].medium?.mediumId,
						})
				);

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
				biloMediaClientAdapter.fetchMediaMetadata.mockResolvedValueOnce(metadataItems);

				const expectedUpdatedTools: ExternalTool[] = externalTools.map((externalTool: ExternalTool, i: number) =>
					externalToolFactory.buildWithId(
						{
							...externalTool.getProps(),
							name: metadataItems[i].title,
							description: metadataItems[i].description,
							logoUrl: metadataItems[i].coverSmall.href,
							thumbnail: undefined,
							medium: {
								...externalTool.getProps().medium,
								publisher: metadataItems[i].publisher,
								metadataModifiedAt: new Date(metadataItems[i].modified),
							},
						},
						externalTool.id
					)
				);

				const expectedSyncReport: Partial<MediaSourceSyncReport> = mediaSourceSyncReportFactory
					.withOthersEmpty({ totalCount: mediums.length, successCount: mediums.length })
					.build();
				delete expectedSyncReport.operations;

				const expectedOperations = [
					mediaSourceSyncOperationReportFactory.build({
						status: MediaSourceSyncStatus.SUCCESS,
						operation: MediaSourceSyncOperation.CREATE,
						count: mediums.length,
					}),
				];

				return { mediaSource, expectedSyncReport, expectedOperations, expectedUpdatedTools };
			};

			it('should return the correct sync report with update success status', async () => {
				const { mediaSource, expectedSyncReport, expectedOperations } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toMatchObject(expectedSyncReport);
				expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
			});

			it('should update the media metadata', async () => {
				const { mediaSource, expectedUpdatedTools } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolService.updateExternalTools).toBeCalledWith(expectedUpdatedTools);
			});
		});

		describe('when the media from the external tools had been synced before', () => {
			describe('when the metadata is outdated', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBildungslogin().build();

					const mediums = externalToolMediumFactory.buildList(5, {
						mediaSourceId: mediaSource.sourceId,
						metadataModifiedAt: new Date(),
					});

					const externalTools = mediums.map((medium: ExternalToolMedium) => externalToolFactory.build({ medium }));

					const metadataItems: BiloMediaQueryDataResponse[] = externalTools.map(
						(_externalTool: ExternalTool, i: number) => {
							const cover: BiloLinkResponse = {
								href: `${externalTools[i].logoUrl as string}-modified`,
								rel: 'src',
							};
							return biloMediaQueryDataResponseFactory.build({
								id: externalTools[i].medium?.mediumId,
								title: `${externalTools[i].name}-modified`,
								description: `${externalTools[i].description as string}-modified`,
								modified: (externalTools[i].medium?.metadataModifiedAt?.getTime() as number) + 3600 * 1000,
								cover,
							});
						}
					);

					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
					biloMediaClientAdapter.fetchMediaMetadata.mockResolvedValueOnce(metadataItems);

					const expectedUpdatedTools: ExternalTool[] = externalTools.map((externalTool: ExternalTool, i: number) =>
						externalToolFactory.buildWithId(
							{
								...externalTool.getProps(),
								name: metadataItems[i].title,
								description: metadataItems[i].description,
								logoUrl: metadataItems[i].coverSmall.href,
								thumbnail: undefined,
								medium: {
									...externalTool.getProps().medium,
									publisher: metadataItems[i].publisher,
									metadataModifiedAt: new Date(metadataItems[i].modified),
								},
							},
							externalTool.id
						)
					);

					const expectedSyncReport: Partial<MediaSourceSyncReport> = mediaSourceSyncReportFactory
						.withOthersEmpty({ totalCount: mediums.length, successCount: mediums.length })
						.build();
					delete expectedSyncReport.operations;

					const expectedOperations = [
						mediaSourceSyncOperationReportFactory.build({
							status: MediaSourceSyncStatus.SUCCESS,
							operation: MediaSourceSyncOperation.UPDATE,
							count: mediums.length,
						}),
					];

					return { mediaSource, expectedSyncReport, expectedOperations, expectedUpdatedTools };
				};

				it('should return sync report with create success status', async () => {
					const { mediaSource, expectedSyncReport, expectedOperations } = setup();

					const result = await strategy.syncAllMediaMetadata(mediaSource);

					expect(result).toMatchObject(expectedSyncReport);
					expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
				});

				it('should update the media metadata', async () => {
					const { mediaSource, expectedUpdatedTools } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(externalToolService.updateExternalTools).toBeCalledWith(expectedUpdatedTools);
				});
			});

			describe('when the metadata is not outdated', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBildungslogin().build();

					const mediums = externalToolMediumFactory.buildList(5, {
						mediaSourceId: mediaSource.sourceId,
						metadataModifiedAt: new Date(),
						publisher: undefined,
					});

					const externalTools = mediums.map((medium: ExternalToolMedium) => externalToolFactory.build({ medium }));

					const metadataItems: BiloMediaQueryDataResponse[] = externalTools.map((externalTool: ExternalTool) => {
						const coverSmall: BiloLinkResponse = {
							href: externalTool.logoUrl as string,
							rel: 'src',
						};
						return biloMediaQueryDataResponseFactory.build({
							id: externalTool.medium?.mediumId,
							title: externalTool.name,
							description: externalTool.description,
							publisher: undefined,
							modified: externalTool.medium?.metadataModifiedAt?.getTime() as number,
							coverSmall,
						});
					});

					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
					biloMediaClientAdapter.fetchMediaMetadata.mockResolvedValueOnce(metadataItems);

					const expectedSyncReport: Partial<MediaSourceSyncReport> = mediaSourceSyncReportFactory
						.withOthersEmpty({ totalCount: mediums.length, successCount: mediums.length })
						.build();
					delete expectedSyncReport.operations;

					const expectedOperations = [
						mediaSourceSyncOperationReportFactory.build({
							status: MediaSourceSyncStatus.SUCCESS,
							operation: MediaSourceSyncOperation.UPDATE,
							count: mediums.length,
						}),
					];

					return { mediaSource, expectedSyncReport, expectedOperations };
				};

				it('should return sync report with update success status', async () => {
					const { mediaSource, expectedSyncReport, expectedOperations } = setup();

					const result = await strategy.syncAllMediaMetadata(mediaSource);

					expect(result).toMatchObject(expectedSyncReport);
					expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
				});

				it('should not update the media metadata', async () => {
					const { mediaSource } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(externalToolService.updateExternalTools).toBeCalledWith([]);
				});
			});

			describe('when the metadata is not outdated, but is different from fetched metadata', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBildungslogin().build();

					const mediums = externalToolMediumFactory.buildList(5, {
						mediaSourceId: mediaSource.sourceId,
						metadataModifiedAt: new Date(),
						publisher: undefined,
					});

					const externalTools = mediums.map((medium: ExternalToolMedium) => externalToolFactory.build({ medium }));

					const metadataItems: BiloMediaQueryDataResponse[] = externalTools.map((externalTool: ExternalTool) => {
						const coverSmall: BiloLinkResponse = {
							href: externalTool.logoUrl as string,
							rel: 'src',
						};
						return biloMediaQueryDataResponseFactory.build({
							id: externalTool.medium?.mediumId,
							title: `other-${externalTool.name}`,
							description: `other-${externalTool.description as string}`,
							publisher: undefined,
							modified: externalTool.medium?.metadataModifiedAt?.getTime() as number,
							coverSmall,
						});
					});

					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
					biloMediaClientAdapter.fetchMediaMetadata.mockResolvedValueOnce(metadataItems);

					const expectedSyncReport: Partial<MediaSourceSyncReport> = mediaSourceSyncReportFactory
						.withOthersEmpty({ totalCount: mediums.length, successCount: mediums.length })
						.build();
					delete expectedSyncReport.operations;

					const expectedOperations = [
						mediaSourceSyncOperationReportFactory.build({
							status: MediaSourceSyncStatus.SUCCESS,
							operation: MediaSourceSyncOperation.UPDATE,
							count: mediums.length,
						}),
					];

					return { mediaSource, expectedSyncReport, expectedOperations };
				};

				it('should not update the media metadata', async () => {
					const { mediaSource } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(externalToolService.updateExternalTools).toBeCalledWith([]);
				});
			});
		});

		describe('when the media source did not deliver the requested metadata', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withBildungslogin().build();

				const mediums = externalToolMediumFactory.buildList(3, {
					mediaSourceId: mediaSource.sourceId,
					metadataModifiedAt: undefined,
				});

				const externalTools = mediums.map((medium: ExternalToolMedium) => externalToolFactory.build({ medium }));

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
				biloMediaClientAdapter.fetchMediaMetadata.mockResolvedValueOnce([]);

				const expectedSyncReport: Partial<MediaSourceSyncReport> = mediaSourceSyncReportFactory
					.withOthersEmpty({ totalCount: mediums.length, undeliveredCount: mediums.length })
					.build();
				delete expectedSyncReport.operations;

				const expectedOperations = [
					mediaSourceSyncOperationReportFactory.build({
						status: MediaSourceSyncStatus.UNDELIVERED,
						operation: MediaSourceSyncOperation.ANY,
						count: 3,
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

			it('should not update the media metadata', async () => {
				const { mediaSource } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolService.updateExternalTools).toBeCalledWith([]);
			});
		});

		describe('when the media metadata failed to be updated', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withBildungslogin().build();

				const mediums = externalToolMediumFactory.buildList(3, {
					mediaSourceId: mediaSource.sourceId,
					metadataModifiedAt: undefined,
				});

				const externalTools = mediums.map((medium: ExternalToolMedium) => externalToolFactory.build({ medium }));

				const metadataItems: BiloMediaQueryDataResponse = biloMediaQueryDataResponseFactory.build({
					id: externalTools[0].medium?.mediumId,
				});

				const badBiloMetadata: BiloMediaQueryDataResponse[] = [
					biloMediaQueryDataResponseFactory.build({
						id: externalTools[1].medium?.mediumId,
						cover: undefined,
					}),
					biloMediaQueryDataResponseFactory.build({
						id: externalTools[2].medium?.mediumId,
						cover: undefined,
					}),
				];

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
				biloMediaClientAdapter.fetchMediaMetadata.mockResolvedValueOnce([metadataItems, ...badBiloMetadata]);

				const expectedUpdatedTools: ExternalTool[] = [
					externalToolFactory.buildWithId(
						{
							...externalTools[0].getProps(),
							name: metadataItems.title,
							description: metadataItems.description,
							logoUrl: metadataItems.coverSmall.href,
							thumbnail: undefined,
							medium: {
								...externalTools[0].getProps().medium,
								publisher: metadataItems.publisher,
								metadataModifiedAt: new Date(metadataItems.modified),
							},
						},
						externalTools[0].id
					),
				];

				const expectedSyncReport: Partial<MediaSourceSyncReport> = mediaSourceSyncReportFactory
					.withOthersEmpty({ totalCount: mediums.length, successCount: 1, failedCount: 2 })
					.build();
				delete expectedSyncReport.operations;

				const expectedOperations = [
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
				];

				return { mediaSource, expectedSyncReport, expectedOperations, expectedUpdatedTools, badBiloMetadata };
			};

			it('should return sync report with error operations', async () => {
				const { mediaSource, expectedSyncReport, expectedOperations } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toMatchObject(expectedSyncReport);
				expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
			});

			it('should log the errors as debug logs', async () => {
				const { mediaSource, badBiloMetadata } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(logger.debug).toHaveBeenCalledWith(expect.any(ErrorLoggable));
				expect(logger.debug).toHaveBeenCalledTimes(badBiloMetadata.length);
			});

			it('should update non-failing media metadata', async () => {
				const { mediaSource, expectedUpdatedTools } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolService.updateExternalTools).toBeCalledWith(expectedUpdatedTools);
			});
		});
	});
});
