import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OfferDTO } from '@infra/vidis-client';
import { vidisOfferItemFactory } from '@infra/vidis-client/testing';
import { MediaSourceDataFormat } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { MediumMetadataDto, MediumMetadataService } from '@modules/medium-metadata';
import { MediumMetadataMapper } from '@modules/medium-metadata/mapper';
import { ExternalTool, ExternalToolService } from '@modules/tool';
import { ExternalToolLogoService, ExternalToolValidationService } from '@modules/tool/external-tool';
import {
	ExternalToolLogoSizeExceededLoggableException,
	ExternalToolLogoWrongFileTypeLoggableException,
} from '@modules/tool/external-tool/loggable';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common/error';
import { ImageMimeType } from '@shared/domain/types';
import { MediaSourceSyncReport } from '../../interface';
import { MediaMetadataSyncFailedLoggable } from '../../loggable';
import { mediaSourceSyncOperationReportFactory, mediaSourceSyncReportFactory } from '../../testing';
import { MediaSourceSyncOperation, MediaSourceSyncStatus } from '../../types';
import { VidisMetadataSyncStrategy } from './vidis-metadata-sync.strategy';

describe(VidisMetadataSyncStrategy.name, () => {
	let module: TestingModule;
	let strategy: VidisMetadataSyncStrategy;

	let externalToolService: DeepMocked<ExternalToolService>;
	let mediumMetadataService: DeepMocked<MediumMetadataService>;
	let externalToolLogoService: DeepMocked<ExternalToolLogoService>;
	let externalToolValidationService: DeepMocked<ExternalToolValidationService>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VidisMetadataSyncStrategy,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: MediumMetadataService,
					useValue: createMock<MediumMetadataService>(),
				},
				{
					provide: ExternalToolLogoService,
					useValue: createMock<ExternalToolLogoService>(),
				},
				{
					provide: ExternalToolValidationService,
					useValue: createMock<ExternalToolValidationService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		strategy = module.get(VidisMetadataSyncStrategy);
		externalToolService = module.get(ExternalToolService);
		mediumMetadataService = module.get(MediumMetadataService);
		externalToolLogoService = module.get(ExternalToolLogoService);
		externalToolValidationService = module.get(ExternalToolValidationService);
		logger = module.get(Logger);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getMediaSourceFormat', () => {
		it('should return the vidis media source data format', () => {
			const result = strategy.getMediaSourceFormat();

			expect(result).toEqual(MediaSourceDataFormat.VIDIS);
		});
	});

	describe('syncAllMediaMetadata', () => {
		describe('when all media metadata are delivered', () => {
			describe('when the all metadata values are outdated', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withVidis().build();

					const offerIds = [100, 101, 102];

					const offerItems = offerIds.map((_id: number, i: number) =>
						vidisOfferItemFactory.build({ offerId: offerIds[i] })
					);
					const metadataItems = offerItems.map((_item: OfferDTO, i: number) =>
						MediumMetadataMapper.mapVidisMetadataToMediumMetadata(offerIds[i].toString(), offerItems[i])
					);

					const externalTools = metadataItems.map((_item: MediumMetadataDto, i: number) =>
						externalToolFactory
							.withMedium({
								mediumId: metadataItems[i].mediumId.toString(),
								mediaSourceId: mediaSource.sourceId,
							})
							.build()
					);

					const mockedLogoImageType = ImageMimeType.PNG;
					const updatedExternalTools = externalTools.map((_tool: ExternalTool, i: number) =>
						externalToolFactory.buildWithId(
							{
								...externalTools[i].getProps(),
								name: metadataItems[i].name,
								description: metadataItems[i].description,
								logo: metadataItems[i].logo,
								logoUrl: `data:${mockedLogoImageType.valueOf()};base64,${metadataItems[i].logo as string}`,
							},
							externalTools[i].id
						)
					);

					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
					mediumMetadataService.getMetadataItems.mockResolvedValueOnce(metadataItems);
					externalToolLogoService.detectAndValidateLogoImageType.mockReturnValue(mockedLogoImageType);

					const expectedSyncReport: Partial<MediaSourceSyncReport> = mediaSourceSyncReportFactory
						.withOthersEmpty({ totalCount: offerItems.length, successCount: offerItems.length })
						.build();
					delete expectedSyncReport.operations;

					const expectedOperations = [
						mediaSourceSyncOperationReportFactory.build({
							status: MediaSourceSyncStatus.SUCCESS,
							operation: MediaSourceSyncOperation.UPDATE,
							count: offerItems.length,
						}),
					];

					return {
						mediaSource,
						updatedExternalTools,
						expectedSyncReport,
						expectedOperations,
					};
				};

				it('should return sync report with update success status', async () => {
					const { mediaSource, expectedSyncReport, expectedOperations } = setup();

					const result = await strategy.syncAllMediaMetadata(mediaSource);

					expect(result).toMatchObject(expectedSyncReport);
					expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
				});

				it('should update the media metadata', async () => {
					const { mediaSource, updatedExternalTools } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(externalToolService.updateExternalTools).toBeCalledWith(updatedExternalTools);
				});
			});

			describe('when only the medium title is outdated', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withVidis().build();

					const offerId = 100;
					const offerItem = vidisOfferItemFactory.build({
						offerId,
						offerTitle: 'test-vidis-title',
						offerLogo: undefined,
						offerDescription: 'Test Vidis Description',
					});
					const metadataItem = MediumMetadataMapper.mapVidisMetadataToMediumMetadata(offerId.toString(), offerItem);

					const externalTool = externalToolFactory
						.withMedium({
							mediumId: metadataItem.mediumId.toString(),
							mediaSourceId: mediaSource.sourceId,
						})
						.build({ name: `${metadataItem.name}-other`, description: metadataItem.description });

					const mockedLogoImageType = ImageMimeType.PNG;
					const updatedExternalTool = externalToolFactory.buildWithId(
						{
							...externalTool.getProps(),
							name: metadataItem.name,
							description: metadataItem.description,
						},
						externalTool.id
					);

					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce([externalTool]);
					mediumMetadataService.getMetadataItems.mockResolvedValueOnce([metadataItem]);
					externalToolLogoService.detectAndValidateLogoImageType.mockReturnValueOnce(mockedLogoImageType);

					const expectedSyncReport: Partial<MediaSourceSyncReport> = mediaSourceSyncReportFactory
						.withOthersEmpty({ totalCount: 1, successCount: 1 })
						.build();
					delete expectedSyncReport.operations;

					const expectedOperations = [
						mediaSourceSyncOperationReportFactory.build({
							status: MediaSourceSyncStatus.SUCCESS,
							operation: MediaSourceSyncOperation.UPDATE,
							count: 1,
						}),
					];

					return {
						mediaSource,
						updatedExternalTool,
						expectedSyncReport,
						expectedOperations,
					};
				};

				it('should return sync report with update success status', async () => {
					const { mediaSource, expectedSyncReport, expectedOperations } = setup();

					const result = await strategy.syncAllMediaMetadata(mediaSource);

					expect(result).toMatchObject(expectedSyncReport);
					expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
				});

				it('should update the media metadata', async () => {
					const { mediaSource, updatedExternalTool } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(externalToolService.updateExternalTools).toBeCalledWith([updatedExternalTool]);
				});
			});

			describe('when only the medium logo is outdated', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withVidis().build();

					const offerId = 100;
					const offerItem = vidisOfferItemFactory.build({
						offerId,
						offerTitle: undefined,
						offerLongTitle: undefined,
						offerLogo: btoa('VIDIS Test Logo'),
						offerDescription: 'Test Vidis Description',
					});
					const metadataItem = MediumMetadataMapper.mapVidisMetadataToMediumMetadata(offerId.toString(), offerItem);

					const externalTool = externalToolFactory
						.withMedium({
							mediumId: metadataItem.mediumId.toString(),
							mediaSourceId: mediaSource.sourceId,
						})
						.build({ logo: btoa('Other VIDIS Test Logo'), description: metadataItem.description });

					const mockedLogoImageType = ImageMimeType.PNG;
					const updatedExternalTool = externalToolFactory.buildWithId(
						{
							...externalTool.getProps(),
							logo: metadataItem.logo,
							logoUrl: `data:${mockedLogoImageType.valueOf()};base64,${metadataItem.logo as string}`,
							description: metadataItem.description,
						},
						externalTool.id
					);

					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce([externalTool]);
					mediumMetadataService.getMetadataItems.mockResolvedValueOnce([metadataItem]);
					externalToolLogoService.detectAndValidateLogoImageType.mockReturnValueOnce(mockedLogoImageType);

					const expectedSyncReport: Partial<MediaSourceSyncReport> = mediaSourceSyncReportFactory
						.withOthersEmpty({ totalCount: 1, successCount: 1 })
						.build();
					delete expectedSyncReport.operations;

					const expectedOperations = [
						mediaSourceSyncOperationReportFactory.build({
							status: MediaSourceSyncStatus.SUCCESS,
							operation: MediaSourceSyncOperation.UPDATE,
							count: 1,
						}),
					];

					return {
						mediaSource,
						updatedExternalTool,
						expectedSyncReport,
						expectedOperations,
					};
				};

				it('should return sync report with update success status', async () => {
					const { mediaSource, expectedSyncReport, expectedOperations } = setup();

					const result = await strategy.syncAllMediaMetadata(mediaSource);

					expect(result).toMatchObject(expectedSyncReport);
					expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
				});

				it('should update the media metadata', async () => {
					const { mediaSource, updatedExternalTool } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(externalToolService.updateExternalTools).toBeCalledWith([updatedExternalTool]);
				});
			});

			describe('when the metadata is up-to-date', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withVidis().build();

					const offerId = 100;
					const offerItem = vidisOfferItemFactory.build({ offerId });
					const metadataItem = MediumMetadataMapper.mapVidisMetadataToMediumMetadata(offerId.toString(), offerItem);

					const externalTool = externalToolFactory
						.withMedium({
							mediumId: metadataItem.mediumId.toString(),
							mediaSourceId: mediaSource.sourceId,
						})
						.build({ name: metadataItem.name, logo: metadataItem.logo, description: metadataItem.description });

					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce([externalTool]);
					mediumMetadataService.getMetadataItems.mockResolvedValueOnce([metadataItem]);

					const expectedSyncReport: Partial<MediaSourceSyncReport> = mediaSourceSyncReportFactory
						.withOthersEmpty({ totalCount: 1, successCount: 1 })
						.build();
					delete expectedSyncReport.operations;

					const expectedOperations = [
						mediaSourceSyncOperationReportFactory.build({
							status: MediaSourceSyncStatus.SUCCESS,
							operation: MediaSourceSyncOperation.UPDATE,
							count: 1,
						}),
					];

					return {
						mediaSource,
						expectedSyncReport,
						expectedOperations,
					};
				};

				it('should return sync report with update success status', async () => {
					const { mediaSource, expectedSyncReport, expectedOperations } = setup();

					const result = await strategy.syncAllMediaMetadata(mediaSource);

					expect(result).toMatchObject(expectedSyncReport);
					expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
				});

				it('should not update any media metadata', async () => {
					const { mediaSource } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(externalToolService.updateExternalTools).not.toBeCalled();
				});
			});

			describe('when the fetched metadata does provide a medium title', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withVidis().build();

					const offerId = 100;
					const offerItem = vidisOfferItemFactory.build({
						offerId,
						offerTitle: undefined,
						offerLongTitle: undefined,
					});
					const metadataItem = MediumMetadataMapper.mapVidisMetadataToMediumMetadata(offerId.toString(), offerItem);

					const externalTool = externalToolFactory
						.withMedium({
							mediumId: metadataItem.mediumId.toString(),
							mediaSourceId: mediaSource.sourceId,
						})
						.build({ description: `${metadataItem.description as string} Other` });

					const mockedLogoImageType = ImageMimeType.PNG;
					const updatedExternalTool = externalToolFactory.buildWithId(
						{
							...externalTool.getProps(),
							description: metadataItem.description,
							logo: metadataItem.logo,
							logoUrl: `data:${mockedLogoImageType.valueOf()};base64,${metadataItem.logo as string}`,
						},
						externalTool.id
					);

					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce([externalTool]);
					mediumMetadataService.getMetadataItems.mockResolvedValueOnce([metadataItem]);
					externalToolLogoService.detectAndValidateLogoImageType.mockReturnValueOnce(mockedLogoImageType);

					const expectedSyncReport: Partial<MediaSourceSyncReport> = mediaSourceSyncReportFactory
						.withOthersEmpty({ totalCount: 1, successCount: 1 })
						.build();
					delete expectedSyncReport.operations;

					const expectedOperations = [
						mediaSourceSyncOperationReportFactory.build({
							status: MediaSourceSyncStatus.SUCCESS,
							operation: MediaSourceSyncOperation.UPDATE,
							count: 1,
						}),
					];

					return {
						mediaSource,
						updatedExternalTool,
						expectedSyncReport,
						expectedOperations,
					};
				};

				it('should return sync report with update success status', async () => {
					const { mediaSource, expectedSyncReport, expectedOperations } = setup();

					const result = await strategy.syncAllMediaMetadata(mediaSource);

					expect(result).toMatchObject(expectedSyncReport);
					expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
				});

				it('should update the media metadata without changing its original title', async () => {
					const { mediaSource, updatedExternalTool } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(externalToolService.updateExternalTools).toBeCalledWith([updatedExternalTool]);
				});
			});

			describe('when the fetched metadata does not has medium logo', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withVidis().build();

					const offerId = 100;
					const offerItem = vidisOfferItemFactory.build({
						offerId,
						offerLogo: undefined,
					});
					const metadataItem = MediumMetadataMapper.mapVidisMetadataToMediumMetadata(offerId.toString(), offerItem);

					const externalTool = externalToolFactory
						.withMedium({
							mediumId: metadataItem.mediumId.toString(),
							mediaSourceId: mediaSource.sourceId,
						})
						.build({ description: `${metadataItem.description as string} Other` });

					const updatedExternalTool = externalToolFactory.buildWithId(
						{
							...externalTool.getProps(),
							name: metadataItem.name,
							description: metadataItem.description,
						},
						externalTool.id
					);

					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce([externalTool]);
					mediumMetadataService.getMetadataItems.mockResolvedValueOnce([metadataItem]);

					const expectedSyncReport: Partial<MediaSourceSyncReport> = mediaSourceSyncReportFactory
						.withOthersEmpty({ totalCount: 1, successCount: 1 })
						.build();
					delete expectedSyncReport.operations;

					const expectedOperations = [
						mediaSourceSyncOperationReportFactory.build({
							status: MediaSourceSyncStatus.SUCCESS,
							operation: MediaSourceSyncOperation.UPDATE,
							count: 1,
						}),
					];

					return {
						mediaSource,
						updatedExternalTool,
						expectedSyncReport,
						expectedOperations,
					};
				};

				it('should return sync report with update success status', async () => {
					const { mediaSource, expectedSyncReport, expectedOperations } = setup();

					const result = await strategy.syncAllMediaMetadata(mediaSource);

					expect(result).toMatchObject(expectedSyncReport);
					expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
				});

				it('should update the media metadata without changing its logo', async () => {
					const { mediaSource, updatedExternalTool } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(externalToolService.updateExternalTools).toBeCalledWith([updatedExternalTool]);
				});
			});

			describe('when the logo image type provided is unsupported', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withVidis().build();

					const offerId = 100;
					const offerItem = vidisOfferItemFactory.build({ offerId });
					const metadataItem = MediumMetadataMapper.mapVidisMetadataToMediumMetadata(offerId.toString(), offerItem);

					const externalTool = externalToolFactory
						.withMedium({
							mediumId: metadataItem.mediumId.toString(),
							mediaSourceId: mediaSource.sourceId,
						})
						.build();

					const updatedExternalTool = externalToolFactory.buildWithId(
						{
							...externalTool.getProps(),
							name: metadataItem.name,
							description: metadataItem.description,
						},
						externalTool.id
					);

					const wrongFileTypeException = new ExternalToolLogoWrongFileTypeLoggableException();

					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce([externalTool]);
					mediumMetadataService.getMetadataItems.mockResolvedValueOnce([metadataItem]);
					externalToolLogoService.detectAndValidateLogoImageType.mockImplementationOnce(() => {
						throw wrongFileTypeException;
					});

					const expectedSyncReport: Partial<MediaSourceSyncReport> = mediaSourceSyncReportFactory
						.withOthersEmpty({ totalCount: 1, partialCount: 1 })
						.build();
					delete expectedSyncReport.operations;

					const expectedOperations = [
						mediaSourceSyncOperationReportFactory.build({
							status: MediaSourceSyncStatus.PARTIAL,
							operation: MediaSourceSyncOperation.ANY,
							count: 1,
						}),
					];

					return {
						mediaSource,
						updatedExternalTool,
						expectedSyncReport,
						expectedOperations,
						wrongFileTypeException,
					};
				};

				it('should return sync report with partial status', async () => {
					const { mediaSource, expectedSyncReport, expectedOperations } = setup();

					const result = await strategy.syncAllMediaMetadata(mediaSource);

					expect(result).toMatchObject(expectedSyncReport);
					expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
				});

				it('should log an MediaMetadataSyncFailedLoggable as warning log', async () => {
					const { mediaSource, updatedExternalTool, wrongFileTypeException } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(logger.warning).toBeCalledWith(
						new MediaMetadataSyncFailedLoggable(
							updatedExternalTool.medium?.mediumId as string,
							mediaSource.format as MediaSourceDataFormat,
							wrongFileTypeException
						)
					);
				});

				it('should update the media metadata without changing its logo', async () => {
					const { mediaSource, updatedExternalTool } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(externalToolService.updateExternalTools).toBeCalledWith([updatedExternalTool]);
				});
			});

			describe('when the logo image size exceeds the allowed limit', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withVidis().build();

					const offerId = 100;
					const offerItem = vidisOfferItemFactory.build({ offerId });
					const metadataItem = MediumMetadataMapper.mapVidisMetadataToMediumMetadata(offerId.toString(), offerItem);

					const externalTool = externalToolFactory
						.withMedium({
							mediumId: metadataItem.mediumId.toString(),
							mediaSourceId: mediaSource.sourceId,
						})
						.build();

					const updatedExternalTool = externalToolFactory.buildWithId(
						{
							...externalTool.getProps(),
							name: metadataItem.name,
							description: metadataItem.description,
						},
						externalTool.id
					);

					const logoSizeExceededException = new ExternalToolLogoSizeExceededLoggableException(externalTool.id, 1000000);

					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce([externalTool]);
					mediumMetadataService.getMetadataItems.mockResolvedValueOnce([metadataItem]);
					externalToolLogoService.detectAndValidateLogoImageType.mockReturnValueOnce(ImageMimeType.PNG);
					externalToolLogoService.validateLogoSize.mockImplementationOnce(() => {
						throw logoSizeExceededException;
					});

					const expectedSyncReport: Partial<MediaSourceSyncReport> = mediaSourceSyncReportFactory
						.withOthersEmpty({ totalCount: 1, partialCount: 1 })
						.build();
					delete expectedSyncReport.operations;

					const expectedOperations = [
						mediaSourceSyncOperationReportFactory.build({
							status: MediaSourceSyncStatus.PARTIAL,
							operation: MediaSourceSyncOperation.ANY,
							count: 1,
						}),
					];

					return {
						mediaSource,
						updatedExternalTool,
						expectedSyncReport,
						expectedOperations,
						logoSizeExceededException,
					};
				};

				it('should return sync report with partial status', async () => {
					const { mediaSource, expectedSyncReport, expectedOperations } = setup();

					const result = await strategy.syncAllMediaMetadata(mediaSource);

					expect(result).toMatchObject(expectedSyncReport);
					expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
				});

				it('should log an MediaMetadataSyncFailedLoggable as warning log', async () => {
					const { mediaSource, updatedExternalTool, logoSizeExceededException } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(logger.warning).toBeCalledWith(
						new MediaMetadataSyncFailedLoggable(
							updatedExternalTool.medium?.mediumId as string,
							mediaSource.format as MediaSourceDataFormat,
							logoSizeExceededException
						)
					);
				});

				it('should update the media metadata without changing its logo', async () => {
					const { mediaSource, updatedExternalTool } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(externalToolService.updateExternalTools).toBeCalledWith([updatedExternalTool]);
				});
			});

			describe('when there is an error while validating an updated tool', () => {
				const setup = () => {
					const mediaSource = mediaSourceFactory.withVidis().build();

					const offerIds = [100, 101];
					const offerItems = offerIds.map((_id: number, i: number) =>
						vidisOfferItemFactory.build({ offerId: offerIds[i] })
					);
					const metadataItems = offerItems.map((_item: OfferDTO, i: number) =>
						MediumMetadataMapper.mapVidisMetadataToMediumMetadata(offerIds[i].toString(), offerItems[i])
					);

					const externalTools = metadataItems.map((_metadata: MediumMetadataDto, i: number) =>
						externalToolFactory
							.withMedium({
								mediumId: metadataItems[i].mediumId,
								mediaSourceId: mediaSource.sourceId,
							})
							.build()
					);

					const mockedLogoImageType = ImageMimeType.PNG;

					const toolWithoutError = externalTools[1];
					const metadataWithoutError = metadataItems[1];
					const updatedTools = [
						externalToolFactory.buildWithId(
							{
								...toolWithoutError.getProps(),
								name: metadataWithoutError.name,
								description: metadataWithoutError.description,
								logo: metadataWithoutError.logo,
								logoUrl: `data:${mockedLogoImageType.valueOf()};base64,${metadataWithoutError.logo as string}`,
							},
							toolWithoutError.id
						),
					];

					const error = new ValidationError('Invalid updated tool');

					externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
					mediumMetadataService.getMetadataItems.mockResolvedValueOnce(metadataItems);
					externalToolLogoService.detectAndValidateLogoImageType.mockReturnValue(mockedLogoImageType);
					externalToolValidationService.validateUpdate.mockRejectedValueOnce(error);

					const expectedSyncReport: Partial<MediaSourceSyncReport> = mediaSourceSyncReportFactory
						.withOthersEmpty({ totalCount: offerItems.length, failedCount: 1, successCount: 1 })
						.build();
					delete expectedSyncReport.operations;

					const expectedOperations = [
						mediaSourceSyncOperationReportFactory.build({
							status: MediaSourceSyncStatus.FAILED,
							operation: MediaSourceSyncOperation.ANY,
							count: 1,
						}),
						mediaSourceSyncOperationReportFactory.build({
							status: MediaSourceSyncStatus.SUCCESS,
							operation: MediaSourceSyncOperation.UPDATE,
							count: 1,
						}),
					];

					return {
						mediaSource,
						expectedSyncReport,
						expectedOperations,
						updatedTools,
						mediumWithError: metadataItems[0],
						error,
					};
				};

				it('should return the correct sync report', async () => {
					const { mediaSource, expectedSyncReport, expectedOperations } = setup();

					const result = await strategy.syncAllMediaMetadata(mediaSource);

					expect(result).toMatchObject(expectedSyncReport);
					expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
				});

				it('should log a MediaMetadataSyncFailedLoggable as warning log ', async () => {
					const { mediaSource, mediumWithError, error } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(logger.warning).toBeCalledWith(
						new MediaMetadataSyncFailedLoggable(
							mediumWithError.mediumId,
							mediaSource.format as MediaSourceDataFormat,
							error
						)
					);
				});

				it('should update the metadata of the medium without error', async () => {
					const { mediaSource, updatedTools } = setup();

					await strategy.syncAllMediaMetadata(mediaSource);

					expect(externalToolService.updateExternalTools).toBeCalledWith(updatedTools);
				});
			});
		});

		describe('when the media source did not deliver metadata for all the media', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withVidis().build();

				const offerIds = [100, 101, 102, 103, 104];
				const offerItems = offerIds.map((_id: number, i: number) =>
					vidisOfferItemFactory.build({ offerId: offerIds[i] })
				);
				const metadataItems = offerItems.map((_item: OfferDTO, i: number) =>
					MediumMetadataMapper.mapVidisMetadataToMediumMetadata(offerIds[i].toString(), offerItems[i])
				);

				const externalTools = offerItems.map((_item: OfferDTO, i: number) =>
					externalToolFactory
						.withMedium({
							mediumId: (offerIds[i] + offerItems.length).toString(),
							mediaSourceId: mediaSource.sourceId,
						})
						.build()
				);

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);
				mediumMetadataService.getMetadataItems.mockResolvedValueOnce(metadataItems);

				const expectedSyncReport: Partial<MediaSourceSyncReport> = mediaSourceSyncReportFactory
					.withOthersEmpty({ totalCount: offerItems.length, undeliveredCount: offerItems.length })
					.build();
				delete expectedSyncReport.operations;

				const expectedOperations = [
					mediaSourceSyncOperationReportFactory.build({
						status: MediaSourceSyncStatus.UNDELIVERED,
						operation: MediaSourceSyncOperation.ANY,
						count: offerItems.length,
					}),
				];

				return {
					mediaSource,
					expectedSyncReport,
					expectedOperations,
				};
			};

			it('should return a report with correct undelivered count', async () => {
				const { mediaSource, expectedSyncReport, expectedOperations } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toMatchObject(expectedSyncReport);
				expect(result.operations).toEqual(expect.arrayContaining(expectedOperations));
			});

			it('should not update any media metadata', async () => {
				const { mediaSource } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolService.updateExternalTools).not.toBeCalled();
			});
		});
	});
});
