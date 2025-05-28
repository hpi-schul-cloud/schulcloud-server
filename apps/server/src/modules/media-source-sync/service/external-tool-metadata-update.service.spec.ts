import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MediaSourceDataFormat } from '@modules/media-source';
import { mediumMetadataDtoFactory } from '@modules/medium-metadata/testing';
import { ExternalTool, ExternalToolLogoService, ExternalToolMedium } from '@modules/tool';
import { ExternalToolMediumStatus } from '@modules/tool/external-tool/enum';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { Test, TestingModule } from '@nestjs/testing';
import _ from 'lodash';
import { ExternalToolMetadataUpdateService } from './external-tool-metadata-update.service';

describe(ExternalToolMetadataUpdateService.name, () => {
	let module: TestingModule;
	let service: ExternalToolMetadataUpdateService;

	let externalToolLogoService: DeepMocked<ExternalToolLogoService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolMetadataUpdateService,
				{
					provide: ExternalToolLogoService,
					useValue: createMock<ExternalToolLogoService>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolMetadataUpdateService);
		externalToolLogoService = module.get(ExternalToolLogoService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('updateExternalToolWithMetadata', () => {
		describe('when updating an external tool with vidis metadata', () => {
			const setup = () => {
				const mediumId = 'medium1';
				const logoData = 'logoData';
				const initialExternalTool = externalToolFactory
					.withMedium({
						mediumId,
						metadataModifiedAt: undefined,
						publisher: 'oldPublisher',
						status: ExternalToolMediumStatus.DRAFT,
					})
					.withFileRecordRef()
					.build({ name: 'oldName', description: 'oldDescription', logoUrl: 'oldLogoUrl' });
				const externalTool = _.cloneDeep(initialExternalTool);
				const mediumMetadata = mediumMetadataDtoFactory.build({
					name: 'newName',
					logoUrl: 'newLogoUrl',
					description: 'newDescription',
					previewLogoUrl: undefined,
					publisher: undefined,
					mediumId,
					modifiedAt: undefined,
				});

				externalToolLogoService.fetchLogo.mockResolvedValueOnce(logoData);

				return {
					mediumMetadata,
					logoData,
					initialExternalTool,
					externalTool,
				};
			};

			it('should fetch the logo', async () => {
				const { mediumMetadata, externalTool } = setup();

				await service.updateExternalToolWithMetadata(externalTool, mediumMetadata, MediaSourceDataFormat.VIDIS);

				expect(externalToolLogoService.fetchLogo).toHaveBeenCalledWith({ logoUrl: mediumMetadata.logoUrl });
			});

			it('should update the external tool', async () => {
				const { mediumMetadata, logoData, initialExternalTool, externalTool } = setup();

				await service.updateExternalToolWithMetadata(externalTool, mediumMetadata, MediaSourceDataFormat.VIDIS);

				expect(externalTool).toEqual(
					expect.objectContaining<Partial<ExternalTool>>({
						name: mediumMetadata.name,
						description: mediumMetadata.description,
						logoUrl: mediumMetadata.logoUrl,
						logo: logoData,
						thumbnail: initialExternalTool.thumbnail,
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						medium: expect.objectContaining<Partial<ExternalToolMedium>>({
							status: initialExternalTool.medium?.status,
							publisher: initialExternalTool.medium?.publisher,
							metadataModifiedAt: undefined,
						}),
					})
				);
			});
		});

		describe('when loading the logo for vidis metadata fails', () => {
			const setup = () => {
				const mediumId = 'medium1';
				const logoData = 'logoData';
				const initialExternalTool = externalToolFactory
					.withMedium({
						mediumId,
						metadataModifiedAt: undefined,
						publisher: 'oldPublisher',
						status: ExternalToolMediumStatus.DRAFT,
					})
					.withFileRecordRef()
					.build({ name: 'oldName', description: 'oldDescription', logoUrl: 'oldLogoUrl' });
				const externalTool = _.cloneDeep(initialExternalTool);
				const mediumMetadata = mediumMetadataDtoFactory.build({
					name: 'newName',
					logoUrl: 'newLogoUrl',
					description: 'newDescription',
					previewLogoUrl: undefined,
					publisher: undefined,
					mediumId,
					modifiedAt: undefined,
				});

				externalToolLogoService.fetchLogo.mockRejectedValueOnce(new Error());

				return {
					mediumMetadata,
					logoData,
					initialExternalTool,
					externalTool,
				};
			};

			it('should not change the external tool', async () => {
				const { mediumMetadata, initialExternalTool, externalTool } = setup();

				await expect(
					service.updateExternalToolWithMetadata(externalTool, mediumMetadata, MediaSourceDataFormat.BILDUNGSLOGIN)
				).rejects.toThrow();

				expect(externalTool).toEqual(initialExternalTool);
			});
		});

		describe('when updating an external tool with bilo metadata', () => {
			const setup = () => {
				const mediumId = 'medium1';
				const logoData = 'logoData';
				const initialExternalTool = externalToolFactory
					.withMedium({
						mediumId,
						metadataModifiedAt: undefined,
						publisher: 'oldPublisher',
						status: ExternalToolMediumStatus.DRAFT,
					})
					.withFileRecordRef()
					.build({ name: 'oldName', description: 'oldDescription', logoUrl: 'oldLogoUrl' });
				const externalTool = _.cloneDeep(initialExternalTool);
				const mediumMetadata = mediumMetadataDtoFactory.build({
					name: 'newName',
					logoUrl: 'newLogoUrl',
					description: 'newDescription',
					previewLogoUrl: 'newPreviewUrl',
					publisher: 'newPublisher',
					mediumId,
					modifiedAt: new Date(),
				});

				externalToolLogoService.fetchLogo.mockResolvedValueOnce(logoData);

				return {
					mediumMetadata,
					logoData,
					initialExternalTool,
					externalTool,
				};
			};

			it('should fetch the logo', async () => {
				const { mediumMetadata, externalTool } = setup();

				await service.updateExternalToolWithMetadata(externalTool, mediumMetadata, MediaSourceDataFormat.BILDUNGSLOGIN);

				expect(externalToolLogoService.fetchLogo).toHaveBeenCalledWith({ logoUrl: mediumMetadata.logoUrl });
			});

			it('should update the external tool', async () => {
				const { mediumMetadata, logoData, initialExternalTool, externalTool } = setup();

				await service.updateExternalToolWithMetadata(externalTool, mediumMetadata, MediaSourceDataFormat.BILDUNGSLOGIN);

				expect(externalTool).toEqual(
					expect.objectContaining<Partial<ExternalTool>>({
						name: mediumMetadata.name,
						description: mediumMetadata.description,
						logoUrl: mediumMetadata.logoUrl,
						logo: logoData,
						thumbnail: initialExternalTool.thumbnail,
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						medium: expect.objectContaining<Partial<ExternalToolMedium>>({
							status: initialExternalTool.medium?.status,
							publisher: mediumMetadata.publisher,
							metadataModifiedAt: mediumMetadata.modifiedAt,
						}),
					})
				);
			});
		});

		describe('when loading the logo for bilo metadata fails', () => {
			const setup = () => {
				const mediumId = 'medium1';
				const logoData = 'logoData';
				const initialExternalTool = externalToolFactory
					.withMedium({
						mediumId,
						metadataModifiedAt: undefined,
						publisher: 'oldPublisher',
						status: ExternalToolMediumStatus.DRAFT,
					})
					.withFileRecordRef()
					.build({ name: 'oldName', description: 'oldDescription', logoUrl: 'oldLogoUrl' });
				const externalTool = _.cloneDeep(initialExternalTool);
				const mediumMetadata = mediumMetadataDtoFactory.build({
					name: 'newName',
					logoUrl: 'newLogoUrl',
					description: 'newDescription',
					previewLogoUrl: 'newPreviewUrl',
					publisher: 'newPublisher',
					mediumId,
					modifiedAt: new Date(),
				});

				externalToolLogoService.fetchLogo.mockRejectedValueOnce(new Error());

				return {
					mediumMetadata,
					logoData,
					initialExternalTool,
					externalTool,
				};
			};

			it('should not change the external tool', async () => {
				const { mediumMetadata, initialExternalTool, externalTool } = setup();

				await expect(
					service.updateExternalToolWithMetadata(externalTool, mediumMetadata, MediaSourceDataFormat.BILDUNGSLOGIN)
				).rejects.toThrow();

				expect(externalTool).toEqual(initialExternalTool);
			});
		});

		describe('when the format does not have an update strategy', () => {
			const setup = () => {
				const mediumId = 'medium1';
				const initialExternalTool = externalToolFactory
					.withMedium({
						mediumId,
						metadataModifiedAt: undefined,
						publisher: 'oldPublisher',
						status: ExternalToolMediumStatus.DRAFT,
					})
					.withFileRecordRef()
					.build({ name: 'oldName', description: 'oldDescription', logoUrl: 'oldLogoUrl' });
				const externalTool = _.cloneDeep(initialExternalTool);
				const mediumMetadata = mediumMetadataDtoFactory.build({
					name: 'newName',
					logoUrl: 'newLogoUrl',
					description: 'newDescription',
					previewLogoUrl: 'newPreviewUrl',
					publisher: 'newPublisher',
					mediumId,
					modifiedAt: new Date(),
				});

				return {
					mediumMetadata,
					initialExternalTool,
					externalTool,
				};
			};

			it('should not change the external tool', async () => {
				const { mediumMetadata, initialExternalTool, externalTool } = setup();

				await service.updateExternalToolWithMetadata(externalTool, mediumMetadata, 'unknown' as MediaSourceDataFormat);

				expect(externalTool).toEqual(initialExternalTool);
			});
		});
	});
});
