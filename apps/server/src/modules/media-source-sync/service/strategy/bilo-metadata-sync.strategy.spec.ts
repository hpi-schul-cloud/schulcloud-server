import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MediaSourceDataFormat } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { MediumMetadataService } from '@modules/medium-metadata';
import { mediumMetadataDtoFactory } from '@modules/medium-metadata/testing';
import { ExternalTool, ExternalToolMedium, ExternalToolService } from '@modules/tool';
import { ExternalToolMediumStatus } from '@modules/tool/external-tool/enum';
import { ExternalToolLogoService, ExternalToolValidationService } from '@modules/tool/external-tool/service';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { BiloMetadataSyncStrategy } from './bilo-metadata-sync.strategy';

describe(BiloMetadataSyncStrategy.name, () => {
	let module: TestingModule;
	let strategy: BiloMetadataSyncStrategy;

	let externalToolService: DeepMocked<ExternalToolService>;
	let mediumMetadataService: DeepMocked<MediumMetadataService>;
	let externalToolLogoService: DeepMocked<ExternalToolLogoService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BiloMetadataSyncStrategy,
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
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ExternalToolLogoService,
					useValue: createMock<ExternalToolLogoService>(),
				},
			],
		}).compile();

		strategy = module.get(BiloMetadataSyncStrategy);
		externalToolService = module.get(ExternalToolService);
		mediumMetadataService = module.get(MediumMetadataService);
		externalToolLogoService = module.get(ExternalToolLogoService);
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
		describe('when there is an external tool with available metadata', () => {
			const setup = () => {
				const mediumId = 'medium1';
				const mediaSource = mediaSourceFactory.withVidis().build();
				const logoData = 'logoData';
				const externalTool = externalToolFactory
					.withMedium({
						mediaSourceId: mediaSource.sourceId,
						mediumId,
						metadataModifiedAt: undefined,
						publisher: undefined,
						status: ExternalToolMediumStatus.DRAFT,
					})
					.withFileRecordRef()
					.build({ name: 'oldName', description: 'oldDescription', logoUrl: 'oldLogoUrl', thumbnail: undefined });
				const mediumMetadata = mediumMetadataDtoFactory.build({
					name: 'newName',
					logoUrl: 'newLogoUrl',
					description: 'newDescription',
					previewLogoUrl: 'newPreviewUrl',
					publisher: 'newPublisher',
					mediumId,
					modifiedAt: new Date(),
				});

				externalToolService.findExternalToolsByMediaSource.mockResolvedValueOnce([externalTool]);
				mediumMetadataService.getMetadataItems.mockResolvedValueOnce([mediumMetadata]);
				externalToolLogoService.fetchLogo.mockResolvedValueOnce(logoData);

				return {
					mediaSource,
					mediumMetadata,
					logoData,
					externalTool,
				};
			};

			it('should save fetch the logo', async () => {
				const { mediaSource, mediumMetadata } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolLogoService.fetchLogo).toHaveBeenCalledWith({ logoUrl: mediumMetadata.logoUrl });
			});

			it('should save the updated external tool', async () => {
				const { mediaSource, mediumMetadata, logoData, externalTool } = setup();

				await strategy.syncAllMediaMetadata(mediaSource);

				expect(externalToolService.updateExternalTools).toHaveBeenCalledWith([
					expect.objectContaining<Partial<ExternalTool>>({
						name: mediumMetadata.name,
						description: mediumMetadata.description,
						logoUrl: mediumMetadata.logoUrl,
						logo: logoData,
						thumbnail: externalTool.thumbnail,
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						medium: expect.objectContaining<Partial<ExternalToolMedium>>({
							status: ExternalToolMediumStatus.ACTIVE,
							publisher: mediumMetadata.publisher,
							metadataModifiedAt: mediumMetadata.modifiedAt,
						}),
					}),
				]);
			});
		});
	});
});
