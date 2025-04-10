import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExternalTool, ExternalToolService } from '@modules/tool';
import { MediumMetadataDto, MediumMetadataService } from '@modules/medium-metadata';
import { MediaSourceDataFormat } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { Injectable } from '@nestjs/common';
import { MediaSourceSyncReportFactory } from '../../factory';
import { MediaSourceSyncReport } from '../../interface';
import { mediaSourceSyncReportFactory } from '../../testing';
import { BaseMetadataSyncStrategy } from './base-metadata-sync.strategy';

const mockMediaSourceReport = mediaSourceSyncReportFactory.build();

@Injectable()
class MockMetadataSyncStrategy extends BaseMetadataSyncStrategy {
	getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.VIDIS;
	}

	protected async syncExternalToolMediumMetadata(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		externalTools: ExternalTool[],
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		metadataItems: MediumMetadataDto[]
	): Promise<MediaSourceSyncReport> {
		return await Promise.resolve(mockMediaSourceReport);
	}
}

describe(BaseMetadataSyncStrategy.name, () => {
	let module: TestingModule;
	let strategy: BaseMetadataSyncStrategy;

	let externalToolService: DeepMocked<ExternalToolService>;
	let mediumMetadataService: DeepMocked<MediumMetadataService>;

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
			],
		}).compile();

		strategy = module.get(MockMetadataSyncStrategy);
		externalToolService = module.get(ExternalToolService);
		mediumMetadataService = module.get(MediumMetadataService);
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

		describe('when there are external tools with medium from the media source', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withVidis().build();

				const externalTools = externalToolFactory.withMedium({ mediaSourceId: mediaSource.sourceId }).buildList(5);
				const mediumIds = externalTools.map((externalTool: ExternalTool) => externalTool.medium?.mediumId);

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce(externalTools);

				return {
					mediaSource,
					mediumIds,
				};
			};

			it('should return a sync report', async () => {
				const { mediaSource } = setup();

				const result = await strategy.syncAllMediaMetadata(mediaSource);

				expect(result).toEqual(mockMediaSourceReport);
			});

			it('should fetch the media metadata', async () => {
				const { mediaSource, mediumIds } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(mediumMetadataService.getMetadataItems).toBeCalledWith(mediumIds, mediaSource);
			});
		});
	});
});
