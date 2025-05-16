import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BiloLinkResponse, BiloMediaClientAdapter, BiloMediaQueryDataResponse } from '@infra/bilo-client';
import { biloMediaQueryDataResponseFactory } from '@infra/bilo-client/testing';
import { MediaSourceDataFormat } from '@modules/media-source';
import { MediaSourceSyncReportFactory } from '@modules/media-source-sync/factory';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { ExternalToolService } from '@modules/tool';
import { ExternalTool, ExternalToolMedium } from '@modules/tool/external-tool/domain';
import { ExternalToolLogoService, ExternalToolValidationService } from '@modules/tool/external-tool/service';
import { externalToolFactory, externalToolMediumFactory } from '@modules/tool/external-tool/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common/error';
import { MediaSourceSyncReport } from '../../interface';
import { BiloMediaMetadataSyncFailedLoggable } from '../../loggable';
import { mediaSourceSyncOperationReportFactory, mediaSourceSyncReportFactory } from '../../testing';
import { MediaSourceSyncOperation, MediaSourceSyncStatus } from '../../types';
import { BiloMetadataSyncStrategy } from './bilo-metadata-sync.strategy';

describe(BiloMetadataSyncStrategy.name, () => {
	let module: TestingModule;
	let strategy: BiloMetadataSyncStrategy;

	let biloMediaClientAdapter: DeepMocked<BiloMediaClientAdapter>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let externalToolValidationService: DeepMocked<ExternalToolValidationService>;
	let externalToolLogoService: DeepMocked<ExternalToolLogoService>;
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
					provide: ExternalToolValidationService,
					useValue: createMock<ExternalToolValidationService>(),
				},
				{
					provide: ExternalToolLogoService,
					useValue: createMock<ExternalToolLogoService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		strategy = module.get(BiloMetadataSyncStrategy);
		externalToolService = module.get(ExternalToolService);
		externalToolValidationService = module.get(ExternalToolValidationService);
		externalToolLogoService = module.get(ExternalToolLogoService);
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
							logoUrl: metadataItems[i].cover.href,
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
					externalToolValidationService.validateUpdate.mockResolvedValue();
					const base64Logo =
						'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAFRElEQVR4AXWVA7BlSdZG17czz72P5aq/8I9t27ZtBMa27ZnAmIGxbdszbXeX8eq1ni5P5t5zK6KNFbH2Pj7pFFfBbf9w1CAEVC5iqIXt0nijGEgMlxNnLlz2/vxsk4HCFdA9/vtpLkt/9XEJqACF3m1D9RlBuffEa02cRWPEcACjI2L0X9nwu16XfgCUHZtWrUm9AIKL0ENPew8XwdHF52egBGV7UD8+8XGBA5VQxakEBTRGDIAh2Vbpdpb3dHLvTcDXANbPnG+AA2QzB2Bh4UVZUIB7ifTDQOsCi6DWwIwwmaQAPIgQIXnkZGTTdbL5Vzt58GDgWW2Z8qlOT8Cx+5VDh1+WgAK6F+G/ByGlFllDkCMAHDCQIUwRWWaGWZDMPaeYWJ7ZpNEG4FFATFA+dOilBlHDY4fMfmg5I6N6LU2UAgosG1hDrUE4IACQApNj5pasWk513OTyyGTlXcBbpEg5zyYBlEH9mCWt6597Qbt6aLEZrvTwUjGDPJ2Z2jTD9K512FzGxwEKREWq2DGtkqw2ORWa1L7Z5F8CzrQb73p7rbXc1n30uIP/Oj32/OnU5rx9ywz6idZnGNdpBiviwrMvrIt/2e29PYuujlcYAy1QgIqOicvkJadKSv6yieRjoR2vPePQP/ezfKhfu5u2ZutOoZQnGqZAuCtKilGPpVNX8DJk7oaNU0YGhYiKh0+MiaTqQvDg1YF18tJa4vBxB++9vFBptmy3aLp4SpgJgEjJwY2iH9js/MdNYu2c5Rd3Nw8flTYP3X1sHgV3p3pQKoAQsaPJ9Zr5P/969PaVBb+WZjfiNiU5GIFHYDnXOhik2H3S94DHcim/rv383djQe4wzrO7jVL1QasUUcg8kzxHezYf/E5uiMzer3MWry0w4YAgPFCf+jXrqvz8B0L3zvTvrbz8FMJ7ZvvAxojzGY6DqQ0odYWoRbbhVSWU5oizk2mxwWQ7cQcIBC8fzFNp/Jpy3QLrB7Ryg3b9YNj/zQgGETwlawseUMiJpkmkhSlut7Yj6G+D8jDUXREQPp4tF4MgN1I6xw7vduvMm0m2B3+VNTdr9yW0twHWfv/cV4Ejj4j5ObWmB4hGlY+ZjU7wRIN/3ie9e/M033rQXYhOuQCEsQW8VDfum7jzAc4GP3OS1/y0A49WZnWJ0XxghSgda3AulRIqkwyn0WGB3spRy9SAifg+6LYQDFiFsNIDAsFyBmxL+3pPfeac3brrj4QQc3nqXU28q8yeL9uYo5oFerfrL8jnzXwJWd92xl8BrTnMtBF8O4pWgBIEiAAMZQAICeIPC2wv/sf1tAJO8D/gAV8MZr1txgPzrL7w9AcdF8G2Ix4NaqjfeTENK4A6WAAJ4KxEPIPyd01tXfw8MuQydze3s2nF6VrTj3fM34udIliMIAIIXh3gAivVELdGZyT6zHuuvQXdWBAAVuAvws+Hi7H4iTiD8iMKNiJ2jQ/luxGh9eHtjAKWGvOE/3/Gl2z0uIY4Cj4jgjxCZUFu2XbdJ5/wL+RQggAThAMA1L/JSwo95DzUzZwAJqIY1bDjuhxXIwJ+Ae0ZomTJuyvy2aLddt9BfcsIDGVwUgAqMgBYExIWE34vU/BlLeWKdiDY85NJ+WrrVwzJQCP4P8XGJx5MyzeI5dI6egwVgGSREQDi4o/Dv4OXFwAJw2c0fbXjYh7ksS7d4cAIqAMRtJJ5B07136i9dO19wcDb1V7Ay6qm0++T1d4R/CTgOQO6XvnvpDz4CcIWfPMgkdNmHY8s1ttM0G7V2Hmnt3AuBBS5i7pS/JmobgHMF/genpveVAhnqCgAAAABJRU5ErkJggg==';
					externalToolLogoService.fetchLogo.mockResolvedValue(base64Logo);
					const expectedUpdatedTools: ExternalTool[] = externalTools.map((externalTool: ExternalTool, i: number) =>
						externalToolFactory.buildWithId(
							{
								...externalTool.getProps(),
								name: metadataItems[i].title,
								description: metadataItems[i].description,
								logoUrl: metadataItems[i].cover.href,
								logo: base64Logo,
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
						const cover: BiloLinkResponse = {
							href: externalTool.logoUrl as string,
							rel: 'src',
						};
						return biloMediaQueryDataResponseFactory.build({
							id: externalTool.medium?.mediumId,
							title: externalTool.name,
							description: externalTool.description,
							publisher: undefined,
							modified: externalTool.medium?.metadataModifiedAt?.getTime() as number,
							cover,
						});
					});

					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
					biloMediaClientAdapter.fetchMediaMetadata.mockResolvedValueOnce(metadataItems);
					externalToolValidationService.validateUpdate.mockResolvedValue();
					externalToolLogoService.fetchLogo.mockResolvedValue(undefined);

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
						const cover: BiloLinkResponse = {
							href: externalTool.logoUrl as string,
							rel: 'src',
						};
						return biloMediaQueryDataResponseFactory.build({
							id: externalTool.medium?.mediumId,
							title: `other-${externalTool.name}`,
							description: `other-${externalTool.description as string}`,
							publisher: undefined,
							modified: externalTool.medium?.metadataModifiedAt?.getTime() as number,
							cover,
						});
					});

					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
					biloMediaClientAdapter.fetchMediaMetadata.mockResolvedValueOnce(metadataItems);
					externalToolValidationService.validateUpdate.mockResolvedValue();
					externalToolLogoService.fetchLogo.mockResolvedValue(undefined);

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
							logoUrl: metadataItems.cover.href,
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

				expect(logger.debug).toHaveBeenCalledWith(expect.any(BiloMediaMetadataSyncFailedLoggable));
				expect(logger.debug).toHaveBeenCalledTimes(badBiloMetadata.length);
			});

			it('should update non-failing media metadata', async () => {
				const { mediaSource, expectedUpdatedTools } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolService.updateExternalTools).toBeCalledWith(expectedUpdatedTools);
			});
		});

		describe('when the media metadata is not valid external tool data', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withBildungslogin().build();

				const mediums = externalToolMediumFactory.buildList(1, {
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
				externalToolValidationService.validateUpdate.mockRejectedValue(new ValidationError('validation error'));

				const expectedSyncReport: Partial<MediaSourceSyncReport> = mediaSourceSyncReportFactory
					.withOthersEmpty({ totalCount: mediums.length, failedCount: mediums.length })
					.build();
				delete expectedSyncReport.operations;

				const expectedOperations = [
					mediaSourceSyncOperationReportFactory.build({
						status: MediaSourceSyncStatus.FAILED,
						operation: MediaSourceSyncOperation.ANY,
						count: mediums.length,
					}),
				];

				return { mediaSource, expectedSyncReport, expectedOperations };
			};

			it('should return the correct sync report with update fail status', async () => {
				const { mediaSource, expectedSyncReport, expectedOperations } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toMatchObject(expectedSyncReport);
				expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
			});
		});
	});
});
