import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { SchoolSystemOptionsService, SchulConneXProvisioningOptions } from '@modules/legacy-school';
import { schoolSystemOptionsFactory } from '@modules/legacy-school/testing';
import { MediaSourceDataFormat, mediaSourceFactory } from '@modules/media-source';
import { ExternalToolMetadataUpdateService } from '@modules/media-source-sync';
import { MediumMetadataService } from '@modules/medium-metadata';
import { mediumMetadataDtoFactory } from '@modules/medium-metadata/testing';
import { MediaSchoolLicenseService } from '@modules/school-license';
import { mediaSchoolLicenseFactory } from '@modules/school-license/testing';
import { ExternalToolMedium, ExternalToolService, ExternalToolValidationService } from '@modules/tool';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolMediumStatus } from '@modules/tool/external-tool/enum';
import { customParameterFactory, externalToolFactory } from '@modules/tool/external-tool/testing';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { schoolExternalToolFactory } from '@modules/tool/school-external-tool/testing';
import { MediaUserLicense, MediaUserLicenseService } from '@modules/user-license';
import { mediaUserLicenseFactory } from '@modules/user-license/testing';
import { Test, TestingModule } from '@nestjs/testing';
import _ from 'lodash';
import { ExternalToolMetadataUpdateFailedLoggable } from '../../../loggable';
import { SchulconnexToolProvisioningService } from './schulconnex-tool-provisioning.service';

describe(SchulconnexToolProvisioningService.name, () => {
	let module: TestingModule;
	let service: SchulconnexToolProvisioningService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let mediaUserLicenseService: DeepMocked<MediaUserLicenseService>;
	let mediaSchoolLicenseService: DeepMocked<MediaSchoolLicenseService>;
	let schoolSystemOptionsService: DeepMocked<SchoolSystemOptionsService>;
	let externalToolValidationService: DeepMocked<ExternalToolValidationService>;
	let mediumMetadataService: DeepMocked<MediumMetadataService>;
	let externalToolMetadataUpdateService: DeepMocked<ExternalToolMetadataUpdateService>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchulconnexToolProvisioningService,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: MediaUserLicenseService,
					useValue: createMock<MediaUserLicenseService>(),
				},
				{
					provide: MediaSchoolLicenseService,
					useValue: createMock<MediaSchoolLicenseService>(),
				},
				{
					provide: SchoolSystemOptionsService,
					useValue: createMock<SchoolSystemOptionsService>(),
				},
				{
					provide: ExternalToolValidationService,
					useValue: createMock<ExternalToolValidationService>(),
				},
				{
					provide: MediumMetadataService,
					useValue: createMock<MediumMetadataService>(),
				},
				{
					provide: ExternalToolMetadataUpdateService,
					useValue: createMock<ExternalToolMetadataUpdateService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(SchulconnexToolProvisioningService);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		mediaUserLicenseService = module.get(MediaUserLicenseService);
		mediaSchoolLicenseService = module.get(MediaSchoolLicenseService);
		schoolSystemOptionsService = module.get(SchoolSystemOptionsService);
		externalToolValidationService = module.get(ExternalToolValidationService);
		mediumMetadataService = module.get(MediumMetadataService);
		externalToolMetadataUpdateService = module.get(ExternalToolMetadataUpdateService);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('provisionSchoolExternalTool', () => {
		describe('when schoolExternalTool has to be provisioned', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({
					provisioningOptions: { schoolExternalToolProvisioningEnabled: true },
				});
				const mediaUserLicense: MediaUserLicense = mediaUserLicenseFactory.build({ userId });
				const mediaSchoolLicense = mediaSchoolLicenseFactory.build({ schoolId });
				const externalTool: ExternalTool = externalToolFactory
					.withMedium({
						mediumId: mediaUserLicense.mediumId,
						mediaSourceId: mediaUserLicense.mediaSource?.sourceId,
					})
					.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					toolId: externalTool.id,
					schoolId,
				});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([mediaUserLicense]);
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([mediaSchoolLicense]);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(externalTool);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);

				return {
					userId,
					schoolId,
					systemId,
					mediaUserLicense,
					externalTool,
					schoolExternalTool,
				};
			};

			it('should get provisioning options', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolSystemOptionsService.getProvisioningOptions).toHaveBeenCalledWith(
					SchulConneXProvisioningOptions,
					schoolId,
					systemId
				);
			});

			it('should get media user licenses', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(mediaUserLicenseService.getMediaUserLicensesForUser).toHaveBeenCalledWith(userId);
			});

			it('should get external tool', async () => {
				const { userId, schoolId, systemId, mediaUserLicense } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(externalToolService.findExternalToolByMedium).toHaveBeenCalledWith(
					mediaUserLicense.mediumId,
					mediaUserLicense.mediaSource?.sourceId
				);
			});

			it('should look for a school external tool', async () => {
				const { userId, schoolId, systemId, externalTool } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.findSchoolExternalTools).toHaveBeenCalledWith({
					schoolId,
					toolId: externalTool.id,
				});
			});

			it('should save a school external tool', async () => {
				const { userId, schoolId, systemId, externalTool } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).toHaveBeenCalledWith<[SchoolExternalTool]>(
					new SchoolExternalTool({
						id: expect.any(String),
						toolId: externalTool.id,
						isDeactivated: false,
						schoolId,
						parameters: [],
					})
				);
			});
		});

		describe('when schoolExternalToolProvisioningEnabled is false', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);

				return {
					userId,
					schoolId,
					systemId,
				};
			};

			it('should not save a schoolExternalTool', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when no mediaUserLicenses were found', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({
					provisioningOptions: { schoolExternalToolProvisioningEnabled: true },
				});
				const externalTool: ExternalTool = externalToolFactory.build();

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([]);
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);

				return {
					userId,
					schoolId,
					systemId,
				};
			};

			it('should not save a schoolExternalTool', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when no external tool was found and no template exists', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({
					provisioningOptions: { schoolExternalToolProvisioningEnabled: true },
				});
				const mediaUserLicenses: MediaUserLicense[] = [mediaUserLicenseFactory.build({ userId })];
				const externalTool: ExternalTool = externalToolFactory
					.withMedium({ status: ExternalToolMediumStatus.DRAFT })
					.build();

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce(mediaUserLicenses);
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);

				return {
					userId,
					schoolId,
					systemId,
				};
			};

			it('should not create a school external tool', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when no external tool was found, but a template for a media source without format', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({
					provisioningOptions: { schoolExternalToolProvisioningEnabled: true },
				});
				const mediaSource = mediaSourceFactory.build({ sourceId: 'mediaSourceId', format: undefined });
				const mediaUserLicense = mediaUserLicenseFactory.build({
					userId,
					mediaSource,
					mediumId: 'mediumId',
				});
				const initialExternalToolTemplate = externalToolFactory
					.withFileRecordRef()
					.withMedium({
						mediaSourceId: mediaUserLicense.mediaSource?.sourceId,
						status: ExternalToolMediumStatus.TEMPLATE,
					})
					.build();
				const externalTool = _.cloneDeep(initialExternalToolTemplate);

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([mediaUserLicense]);
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(null);
				externalToolService.findTemplate.mockResolvedValueOnce(externalTool);
				externalToolService.createExternalTool.mockResolvedValueOnce(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);

				return {
					userId,
					schoolId,
					systemId,
					mediaUserLicense,
					initialExternalToolTemplate,
					externalTool,
					mediaSource,
				};
			};

			it('should save an external tool draft', async () => {
				const { userId, schoolId, systemId, initialExternalToolTemplate, mediaUserLicense, mediaSource } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(externalToolService.createExternalTool).toHaveBeenCalledWith<[ExternalTool]>(
					new ExternalTool({
						...initialExternalToolTemplate.getProps(),
						id: expect.any(String),
						name: `Draft: ${mediaSource.sourceId} ${mediaUserLicense.mediumId}`,
						thumbnail: undefined,
						medium: new ExternalToolMedium({
							mediumId: mediaUserLicense.mediumId,
							mediaSourceId: mediaSource.sourceId,
							status: ExternalToolMediumStatus.DRAFT,
							publisher: initialExternalToolTemplate.medium?.publisher,
						}),
					})
				);
			});

			it('should not load metadata', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(mediumMetadataService.getMetadataItem).not.toHaveBeenCalled();
			});

			it('should not save a schoolExternalTool', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when no external tool was found, but a template for a media source with format', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const updatedToolName = 'New Tool';
				const { provisioningOptions } = schoolSystemOptionsFactory.build({
					provisioningOptions: { schoolExternalToolProvisioningEnabled: true },
				});
				const mediaSource = mediaSourceFactory.build({
					sourceId: 'mediaSourceId',
					format: MediaSourceDataFormat.VIDIS,
				});
				const mediaUserLicense = mediaUserLicenseFactory.build({
					userId,
					mediaSource,
					mediumId: 'mediumId',
				});
				const initialExternalToolTemplate = externalToolFactory
					.withFileRecordRef()
					.withMedium({
						mediaSourceId: mediaUserLicense.mediaSource?.sourceId,
						status: ExternalToolMediumStatus.TEMPLATE,
					})
					.build();
				const externalTool = _.cloneDeep(initialExternalToolTemplate);
				const mediumMetadata = mediumMetadataDtoFactory.build({
					name: updatedToolName,
				});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([mediaUserLicense]);
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(null);
				externalToolService.findTemplate.mockResolvedValueOnce(externalTool);
				externalToolService.createExternalTool.mockResolvedValueOnce(externalTool);
				mediumMetadataService.getMetadataItem.mockResolvedValueOnce(mediumMetadata);
				externalToolMetadataUpdateService.updateExternalToolWithMetadata.mockImplementation(
					async (externalTool: ExternalTool) => {
						externalTool.name = updatedToolName;
						await Promise.resolve();
					}
				);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);

				return {
					userId,
					schoolId,
					systemId,
					mediaUserLicense,
					initialExternalToolTemplate,
					externalTool,
					updatedToolName,
					mediaSource,
				};
			};

			it('should save an active external tool', async () => {
				const {
					userId,
					schoolId,
					systemId,
					initialExternalToolTemplate,
					mediaUserLicense,
					mediaSource,
					updatedToolName,
				} = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(externalToolService.createExternalTool).toHaveBeenCalledWith<[ExternalTool]>(
					new ExternalTool({
						...initialExternalToolTemplate.getProps(),
						id: expect.any(String),
						name: updatedToolName,
						thumbnail: undefined,
						medium: new ExternalToolMedium({
							mediumId: mediaUserLicense.mediumId,
							mediaSourceId: mediaSource.sourceId,
							status: ExternalToolMediumStatus.ACTIVE,
							publisher: initialExternalToolTemplate.medium?.publisher,
						}),
					})
				);
			});

			it('should save a school external tool', async () => {
				const { userId, schoolId, systemId, externalTool } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).toHaveBeenCalledWith<[SchoolExternalTool]>(
					new SchoolExternalTool({
						id: expect.any(String),
						toolId: externalTool.id,
						isDeactivated: false,
						schoolId,
						parameters: [],
					})
				);
			});
		});

		describe('when loading the metadata for an external tool fails', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({
					provisioningOptions: { schoolExternalToolProvisioningEnabled: true },
				});
				const mediaSource = mediaSourceFactory.build({
					sourceId: 'mediaSourceId',
					format: MediaSourceDataFormat.VIDIS,
				});
				const mediaUserLicense = mediaUserLicenseFactory.build({
					userId,
					mediaSource,
					mediumId: 'mediumId',
				});
				const initialExternalToolTemplate = externalToolFactory
					.withFileRecordRef()
					.withMedium({
						mediaSourceId: mediaUserLicense.mediaSource?.sourceId,
						status: ExternalToolMediumStatus.TEMPLATE,
					})
					.build();
				const externalTool = _.cloneDeep(initialExternalToolTemplate);
				const error = new Error();

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([mediaUserLicense]);
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(null);
				externalToolService.findTemplate.mockResolvedValueOnce(externalTool);
				externalToolService.createExternalTool.mockResolvedValueOnce(externalTool);
				mediumMetadataService.getMetadataItem.mockRejectedValueOnce(error);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);

				return {
					userId,
					schoolId,
					systemId,
					mediaUserLicense,
					initialExternalToolTemplate,
					externalTool,
					mediaSource,
					error,
				};
			};

			it('should log a warning', async () => {
				const { userId, schoolId, systemId, mediaUserLicense, error } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(logger.warning).toHaveBeenCalledWith(
					new ExternalToolMetadataUpdateFailedLoggable(expect.any(ExternalTool), mediaUserLicense, error)
				);
			});

			it('should save an external tool draft', async () => {
				const { userId, schoolId, systemId, initialExternalToolTemplate, mediaUserLicense, mediaSource } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(externalToolService.createExternalTool).toHaveBeenCalledWith<[ExternalTool]>(
					new ExternalTool({
						...initialExternalToolTemplate.getProps(),
						id: expect.any(String),
						name: `Draft: ${mediaSource.sourceId} ${mediaUserLicense.mediumId}`,
						thumbnail: undefined,
						medium: new ExternalToolMedium({
							mediumId: mediaUserLicense.mediumId,
							mediaSourceId: mediaSource.sourceId,
							status: ExternalToolMediumStatus.DRAFT,
							publisher: initialExternalToolTemplate.medium?.publisher,
						}),
					})
				);
			});

			it('should not save a schoolExternalTool', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when the validation for creating an external tool fails', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({
					provisioningOptions: { schoolExternalToolProvisioningEnabled: true },
				});
				const mediaSource = mediaSourceFactory.build({ sourceId: 'mediaSourceId', format: undefined });
				const mediaUserLicense = mediaUserLicenseFactory.build({
					userId,
					mediaSource,
					mediumId: 'mediumId',
				});
				const initialExternalToolTemplate = externalToolFactory
					.withFileRecordRef()
					.withMedium({
						mediaSourceId: mediaUserLicense.mediaSource?.sourceId,
						status: ExternalToolMediumStatus.TEMPLATE,
					})
					.build();
				const externalTool = _.cloneDeep(initialExternalToolTemplate);

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([mediaUserLicense]);
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(null);
				externalToolService.findTemplate.mockResolvedValueOnce(externalTool);
				externalToolValidationService.validateCreate.mockRejectedValueOnce(new Error());
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);

				return {
					userId,
					schoolId,
					systemId,
					mediaUserLicense,
					initialExternalToolTemplate,
					externalTool,
					mediaSource,
				};
			};

			it('should not save an external tool', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(externalToolService.createExternalTool).not.toHaveBeenCalled();
			});

			it('should save save a school external tool', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when the external tool template has no medium', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({
					provisioningOptions: { schoolExternalToolProvisioningEnabled: true },
				});
				const mediaSource = mediaSourceFactory.build({ sourceId: 'mediaSourceId', format: undefined });
				const mediaUserLicense = mediaUserLicenseFactory.build({
					userId,
					mediaSource,
					mediumId: 'mediumId',
				});
				const externalToolTemplate = externalToolFactory.build({
					medium: undefined,
				});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce([mediaUserLicense]);
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(null);
				externalToolService.findTemplate.mockResolvedValueOnce(externalToolTemplate);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);

				return {
					userId,
					schoolId,
					systemId,
					mediaUserLicense,
					mediaSource,
				};
			};

			it('should not save an external tool', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(externalToolService.createExternalTool).not.toHaveBeenCalled();
			});

			it('should save save a school external tool', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when an external tool was found, but is only a draft', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({
					provisioningOptions: { schoolExternalToolProvisioningEnabled: true },
				});
				const mediaUserLicenses: MediaUserLicense[] = [mediaUserLicenseFactory.build({ userId })];

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce(mediaUserLicenses);
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(null);
				externalToolService.findTemplate.mockResolvedValueOnce(null);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);

				return {
					userId,
					schoolId,
					systemId,
				};
			};

			it('should not create a school external tool', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when tool has non-global parameters', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({
					provisioningOptions: { schoolExternalToolProvisioningEnabled: true },
				});
				const mediaUserLicenses: MediaUserLicense[] = [mediaUserLicenseFactory.build({ userId })];
				const externalTool: ExternalTool = externalToolFactory
					.withMedium({
						mediumId: mediaUserLicenses[0].mediumId,
						mediaSourceId: mediaUserLicenses[0].mediaSource?.sourceId,
					})
					.build({
						parameters: [customParameterFactory.build()],
					});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce(mediaUserLicenses);
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([]);

				return {
					userId,
					schoolId,
					systemId,
				};
			};

			it('should not save a schoolExternalTool', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when schoolExternalTool already exists', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({
					provisioningOptions: { schoolExternalToolProvisioningEnabled: true },
				});
				const mediaUserLicenses: MediaUserLicense[] = [mediaUserLicenseFactory.build({ userId })];
				const externalTool: ExternalTool = externalToolFactory
					.withMedium({
						mediumId: mediaUserLicenses[0].mediumId,
						mediaSourceId: mediaUserLicenses[0].mediaSource?.sourceId,
					})
					.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					toolId: externalTool.id,
					schoolId,
				});

				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValueOnce(provisioningOptions);
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValueOnce(mediaUserLicenses);
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValueOnce([]);
				externalToolService.findExternalToolByMedium.mockResolvedValueOnce(externalTool);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool]);

				return {
					userId,
					schoolId,
					systemId,
					mediaUserLicenses,
					externalTool,
					schoolExternalTool,
				};
			};

			it('should not save a schoolExternalTool', async () => {
				const { userId, schoolId, systemId } = setup();

				await service.provisionSchoolExternalTools(userId, schoolId, systemId);

				expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
			});
		});
	});
});
