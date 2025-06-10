import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { mediumMetadataDtoFactory } from '@modules//medium-metadata/testing';
import { MediaSourceDataFormat } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { MediumMetadataService } from '@modules/medium-metadata';
import {
	ExternalToolService,
	ExternalToolValidationService,
	ExternalToolParameterValidationService,
} from '@modules/tool';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaSourceSyncReportFactory } from '../../factory';
import { MediaSourceSyncReport } from '../../interface';
import { MediaSourceSyncOperation, MediaSourceSyncStatus } from '../../types';
import { ExternalToolMetadataUpdateService } from '../external-tool-metadata-update.service';
import { BaseMetadataSyncStrategy } from './base-metadata-sync.strategy';

@Injectable()
class MockMetadataSyncStrategy extends BaseMetadataSyncStrategy {
	getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.VIDIS;
	}
}

describe(BaseMetadataSyncStrategy.name, () => {
	let module: TestingModule;
	let strategy: BaseMetadataSyncStrategy;

	let externalToolService: DeepMocked<ExternalToolService>;
	let mediumMetadataService: DeepMocked<MediumMetadataService>;
	let externalToolValidationService: DeepMocked<ExternalToolValidationService>;
	let externalToolMetadataUpdateService: DeepMocked<ExternalToolMetadataUpdateService>;
	let externalToolParameterValidationService: DeepMocked<ExternalToolParameterValidationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MockMetadataSyncStrategy,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: MediumMetadataService,
					useValue: createMock<MediumMetadataService>(),
				},
				{
					provide: ExternalToolValidationService,
					useValue: createMock<ExternalToolValidationService>(),
				},
				{
					provide: ExternalToolMetadataUpdateService,
					useValue: createMock<ExternalToolMetadataUpdateService>(),
				},
				{
					provide: ExternalToolParameterValidationService,
					useValue: createMock<ExternalToolParameterValidationService>(),
				},
			],
		}).compile();

		strategy = module.get(MockMetadataSyncStrategy);
		externalToolService = module.get(ExternalToolService);
		mediumMetadataService = module.get(MediumMetadataService);
		externalToolValidationService = module.get(ExternalToolValidationService);
		externalToolMetadataUpdateService = module.get(ExternalToolMetadataUpdateService);
		externalToolParameterValidationService = module.get(ExternalToolParameterValidationService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('syncAllMediaMetadata', () => {
		describe('when there are no external tools with medium from the media source', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withVidis().build();

				const emptyReport = MediaSourceSyncReportFactory.buildEmptyReport();

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce([]);

				return {
					mediaSource,
					emptyReport,
				};
			};

			it('should return an empty report', async () => {
				const { mediaSource, emptyReport } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toEqual(emptyReport);
			});

			it('should not fetch any media metadata', async () => {
				const { mediaSource } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(mediumMetadataService.getMetadataItems).not.toBeCalled();
			});
		});

		describe('when there is an external tool with available metadata', () => {
			const setup = () => {
				const mediumId = 'medium1';
				const mediaSource = mediaSourceFactory.withVidis().build();
				const externalTool = externalToolFactory.withMedium({ mediaSourceId: mediaSource.sourceId, mediumId }).build();
				const mediumMetadata = mediumMetadataDtoFactory.build({ modifiedAt: undefined, mediumId });

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce([externalTool]);
				mediumMetadataService.getMetadataItems.mockResolvedValueOnce([mediumMetadata]);
				externalToolParameterValidationService.isNameUnique.mockResolvedValueOnce(true);

				return {
					mediaSource,
					externalTool,
					mediumMetadata,
				};
			};

			it('should update the external tool data', async () => {
				const { mediaSource, externalTool, mediumMetadata } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolMetadataUpdateService.updateExternalToolWithMetadata).toHaveBeenCalledWith(
					externalTool,
					mediumMetadata,
					MediaSourceDataFormat.VIDIS
				);
			});

			it('should validate the external tool', async () => {
				const { mediaSource, externalTool } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolValidationService.validateUpdate).toHaveBeenCalledWith(externalTool.id, externalTool);
			});

			it('should save the external tool', async () => {
				const { mediaSource, externalTool } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolService.updateExternalTools).toHaveBeenCalledWith([externalTool]);
			});

			it('should return a success sync report', async () => {
				const { mediaSource } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toEqual<MediaSourceSyncReport>({
					totalCount: 1,
					successCount: 1,
					failedCount: 0,
					partialCount: 0,
					undeliveredCount: 0,
					operations: [
						{
							operation: MediaSourceSyncOperation.UPDATE,
							status: MediaSourceSyncStatus.SUCCESS,
							count: 1,
						},
					],
				});
			});
		});

		describe('when there is an external tool without available metadata', () => {
			const setup = () => {
				const mediumId = 'medium1';
				const mediaSource = mediaSourceFactory.withVidis().build();
				const externalTool = externalToolFactory.withMedium({ mediaSourceId: mediaSource.sourceId, mediumId }).build();
				const mediumMetadata = mediumMetadataDtoFactory.build({ modifiedAt: undefined, mediumId: 'otherMediumId' });

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce([externalTool]);
				mediumMetadataService.getMetadataItems.mockResolvedValueOnce([mediumMetadata]);

				return {
					mediaSource,
				};
			};

			it('should not update the external tool', async () => {
				const { mediaSource } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolService.updateExternalTools).not.toHaveBeenCalled();
			});

			it('should return a undelivered sync report', async () => {
				const { mediaSource } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toEqual<MediaSourceSyncReport>({
					totalCount: 1,
					successCount: 0,
					failedCount: 0,
					partialCount: 0,
					undeliveredCount: 1,
					operations: [
						{
							operation: MediaSourceSyncOperation.ANY,
							status: MediaSourceSyncStatus.UNDELIVERED,
							count: 1,
						},
					],
				});
			});
		});

		describe('when there is an external tool with up-to-date metadata', () => {
			const setup = () => {
				const mediumId = 'medium1';
				const modifiedAt = new Date();
				const mediaSource = mediaSourceFactory.withVidis().build();
				const externalTool = externalToolFactory
					.withMedium({ mediaSourceId: mediaSource.sourceId, mediumId, metadataModifiedAt: modifiedAt })
					.build();
				const mediumMetadata = mediumMetadataDtoFactory.build({ modifiedAt, mediumId });

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce([externalTool]);
				mediumMetadataService.getMetadataItems.mockResolvedValueOnce([mediumMetadata]);

				return {
					mediaSource,
				};
			};

			it('should not update the external tool', async () => {
				const { mediaSource } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolService.updateExternalTools).not.toHaveBeenCalled();
			});

			it('should return a success sync report', async () => {
				const { mediaSource } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toEqual<MediaSourceSyncReport>({
					totalCount: 1,
					successCount: 1,
					failedCount: 0,
					partialCount: 0,
					undeliveredCount: 0,
					operations: [
						{
							operation: MediaSourceSyncOperation.UPDATE,
							status: MediaSourceSyncStatus.SUCCESS,
							count: 1,
						},
					],
				});
			});
		});

		describe('when the validation for an external tool fails', () => {
			const setup = () => {
				const mediumId = 'medium1';
				const mediaSource = mediaSourceFactory.withVidis().build();
				const externalTool = externalToolFactory.withMedium({ mediaSourceId: mediaSource.sourceId, mediumId }).build();
				const mediumMetadata = mediumMetadataDtoFactory.build({ modifiedAt: undefined, mediumId });

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce([externalTool]);
				mediumMetadataService.getMetadataItems.mockResolvedValueOnce([mediumMetadata]);
				externalToolParameterValidationService.isNameUnique.mockResolvedValueOnce(true);
				externalToolValidationService.validateUpdate.mockRejectedValueOnce(new Error());

				return {
					mediaSource,
				};
			};

			it('should not update the external tool', async () => {
				const { mediaSource } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolService.updateExternalTools).not.toHaveBeenCalled();
			});

			it('should return a failed sync report', async () => {
				const { mediaSource } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toEqual<MediaSourceSyncReport>({
					totalCount: 1,
					successCount: 0,
					failedCount: 1,
					partialCount: 0,
					undeliveredCount: 0,
					operations: [
						{
							operation: MediaSourceSyncOperation.ANY,
							status: MediaSourceSyncStatus.FAILED,
							count: 1,
						},
					],
				});
			});
		});

		describe('when there is an external tool with duplicated name', () => {
			const setup = () => {
				const mediumId = 'medium1';
				const mediaSource = mediaSourceFactory.withVidis().build();
				const externalTool = externalToolFactory.withMedium({ mediaSourceId: mediaSource.sourceId, mediumId }).build();
				const mediumMetadata = mediumMetadataDtoFactory.build({ modifiedAt: undefined, mediumId });

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce([externalTool]);
				mediumMetadataService.getMetadataItems.mockResolvedValueOnce([mediumMetadata]);
				externalToolParameterValidationService.isNameUnique.mockResolvedValueOnce(false);

				const modifiedExternalTool = externalToolFactory.build({
					...externalTool.getProps(),
					name: `${externalTool.name} - [${mediumId}]`,
				});

				return {
					mediaSource,
					externalTool,
					mediumMetadata,
					modifiedExternalTool,
				};
			};

			it('should update the external tool data', async () => {
				const { mediaSource, externalTool, mediumMetadata } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolMetadataUpdateService).toHaveBeenCalledWith(externalTool, mediumMetadata);
			});

			it('should validate the external tool', async () => {
				const { mediaSource, externalTool } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolValidationService.validateUpdate).toHaveBeenCalledWith(externalTool.id, externalTool);
			});

			it('should save the external tool with a modified name', async () => {
				const { mediaSource, modifiedExternalTool } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolService.updateExternalTools).toHaveBeenCalledWith([modifiedExternalTool]);
			});

			it('should return a success sync report', async () => {
				const { mediaSource } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toEqual<MediaSourceSyncReport>({
					totalCount: 1,
					successCount: 1,
					failedCount: 0,
					partialCount: 0,
					undeliveredCount: 0,
					operations: [
						{
							operation: MediaSourceSyncOperation.UPDATE,
							status: MediaSourceSyncStatus.SUCCESS,
							count: 1,
						},
					],
				});
			});
		});
	});
});
