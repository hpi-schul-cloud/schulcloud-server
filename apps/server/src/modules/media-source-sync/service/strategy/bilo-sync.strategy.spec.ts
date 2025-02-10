import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BiloMediaRestClient, BiloMediaQueryResponse, BiloLinkResponse } from '@infra/bilo-client';
import { biloMediaQueryResponseFactory } from '@infra/bilo-client/testing';
import { MediaSourceDataFormat } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { ExternalToolService } from '@modules/tool';
import { ExternalTool, ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { externalToolFactory, externalToolMediumFactory } from '@modules/tool/external-tool/testing';
import { MediaSourceSyncOperation, MediaSourceSyncStatus } from '../../types';
import { MediaSourceSyncReport } from '../../interface';
import { mediaSourceSyncOperationReportFactory } from '../../testing';
import { BiloSyncStrategy } from './bilo-sync.strategy';

describe(BiloSyncStrategy.name, () => {
	let module: TestingModule;
	let strategy: BiloSyncStrategy;
	let externalToolService: DeepMocked<ExternalToolService>;
	let biloMediaFetchService: DeepMocked<BiloMediaRestClient>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BiloSyncStrategy,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: BiloMediaRestClient,
					useValue: createMock<BiloMediaRestClient>(),
				},
			],
		}).compile();

		strategy = module.get(BiloSyncStrategy);
		externalToolService = module.get(ExternalToolService);
		biloMediaFetchService = module.get(BiloMediaRestClient);
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

				const biloResponse: BiloMediaQueryResponse[] = externalTools.map((_externalTool: ExternalTool, i: number) =>
					biloMediaQueryResponseFactory.build({
						id: externalTools[i].medium?.mediumId,
					})
				);

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
				biloMediaFetchService.fetchMediaMetadata.mockResolvedValueOnce(biloResponse);

				const expectedUpdatedTools: ExternalTool[] = externalTools.map((externalTool: ExternalTool, i: number) =>
					externalToolFactory.buildWithId(
						{
							...externalTool.getProps(),
							name: biloResponse[i].title,
							description: biloResponse[i].description,
							logoUrl: biloResponse[i].cover.href,
							thumbnail: undefined,
							medium: {
								...externalTool.getProps().medium,
								publisher: biloResponse[i].publisher,
								metadataModifiedAt: new Date(biloResponse[i].modified * 1000),
							},
						},
						externalTool.id
					)
				);

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
			describe('when the media metadata is outdated', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withBildungslogin().build();

					const mediums = externalToolMediumFactory.buildList(5, {
						mediaSourceId: 'media-source-id',
						metadataModifiedAt: new Date(),
					});

					const externalTools = mediums.map((medium: ExternalToolMedium) => externalToolFactory.build({ medium }));

					const biloResponse: BiloMediaQueryResponse[] = externalTools.map((_externalTool: ExternalTool, i: number) =>
						biloMediaQueryResponseFactory.build({
							id: externalTools[i].medium?.mediumId,
							modified: Math.trunc((externalTools[i].medium?.metadataModifiedAt?.getTime() as number) / 1000) + 3600,
						})
					);

					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
					biloMediaFetchService.fetchMediaMetadata.mockResolvedValueOnce(biloResponse);

					const expectedUpdatedTools: ExternalTool[] = externalTools.map((externalTool: ExternalTool, i: number) =>
						externalToolFactory.buildWithId(
							{
								...externalTool.getProps(),
								name: biloResponse[i].title,
								description: biloResponse[i].description,
								logoUrl: biloResponse[i].cover.href,
								thumbnail: undefined,
								medium: {
									...externalTool.getProps().medium,
									publisher: biloResponse[i].publisher,
									metadataModifiedAt: new Date(biloResponse[i].modified * 1000),
								},
							},
							externalTool.id
						)
					);

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
							id: externalTool.medium?.mediumId,
							title: externalTool.name,
							description: externalTool.description,
							cover: {
								href: externalTool.logoUrl,
								rel: 'src',
							} as BiloLinkResponse,
							modified: Math.trunc((externalTool.medium?.metadataModifiedAt?.getTime() as number) / 1000),
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
		});

		describe('when the media source did not deliver the requested metadata', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withBildungslogin().build();

				const mediums = externalToolMediumFactory.buildList(3, {
					mediaSourceId: 'media-source-id',
					metadataModifiedAt: undefined,
				});

				const externalTools = mediums.map((medium: ExternalToolMedium) => externalToolFactory.build({ medium }));

				const biloResponse: BiloMediaQueryResponse[] = [];

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
				biloMediaFetchService.fetchMediaMetadata.mockResolvedValueOnce(biloResponse);

				const expectedSyncReport: Partial<MediaSourceSyncReport> = {
					totalCount: mediums.length,
					successCount: 0,
					undeliveredCount: 3,
					failedCount: 0,
				};

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
					mediaSourceId: 'media-source-id',
					metadataModifiedAt: undefined,
				});

				const externalTools = mediums.map((medium: ExternalToolMedium) => externalToolFactory.build({ medium }));

				const biloResponse: BiloMediaQueryResponse = biloMediaQueryResponseFactory.build({
					id: externalTools[0].medium?.mediumId,
				});

				const badBiloResponses: BiloMediaQueryResponse[] = [
					biloMediaQueryResponseFactory.build({
						id: externalTools[1].medium?.mediumId,
						cover: undefined,
					}),
					biloMediaQueryResponseFactory.build({
						id: externalTools[2].medium?.mediumId,
						cover: undefined,
					}),
				];

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
				biloMediaFetchService.fetchMediaMetadata.mockResolvedValueOnce([biloResponse, ...badBiloResponses]);

				const expectedUpdatedTools: ExternalTool[] = [
					externalToolFactory.buildWithId(
						{
							...externalTools[0].getProps(),
							name: biloResponse.title,
							description: biloResponse.description,
							logoUrl: biloResponse.cover.href,
							thumbnail: undefined,
							medium: {
								...externalTools[0].getProps().medium,
								publisher: biloResponse.publisher,
								metadataModifiedAt: new Date(biloResponse.modified * 1000),
							},
						},
						externalTools[0].id
					),
				];

				const expectedSyncReport: Partial<MediaSourceSyncReport> = {
					totalCount: mediums.length,
					successCount: 1,
					undeliveredCount: 0,
					failedCount: 2,
				};

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

				return { mediaSource, expectedSyncReport, expectedOperations, expectedUpdatedTools };
			};

			it('should return sync report with error operations', async () => {
				const { mediaSource, expectedSyncReport, expectedOperations } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toMatchObject(expectedSyncReport);
				expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
			});

			it('should update non-failing media metadata', async () => {
				const { mediaSource, expectedUpdatedTools } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolService.updateExternalTools).toBeCalledWith(expectedUpdatedTools);
			});
		});
	});
});
