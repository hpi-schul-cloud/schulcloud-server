import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@infra/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { SchoolSystemOptionsService } from '@modules/legacy-school';
import { schoolSystemOptionsFactory } from '@modules/legacy-school/testing';
import { MediaSourceDataFormat, mediaSourceFactory } from '@modules/media-source';
import { ExternalToolMetadataUpdateService } from '@modules/media-source-sync';
import { MediumMetadataService } from '@modules/medium-metadata';
import { mediumMetadataDtoFactory } from '@modules/medium-metadata/testing';
import { MediaSchoolLicenseService } from '@modules/school-license';
import { mediaSchoolLicenseFactory } from '@modules/school-license/testing';
import { ExternalToolService, ExternalToolValidationService } from '@modules/tool';
import { CustomParameterScope } from '@modules/tool/common/enum';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolMediumStatus } from '@modules/tool/external-tool/enum';
import { customParameterFactory, externalToolFactory } from '@modules/tool/external-tool/testing';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool';
import { schoolExternalToolFactory } from '@modules/tool/school-external-tool/testing';
import { type MediaUserLicense, MediaUserLicenseService } from '@modules/user-license';
import { mediaUserLicenseFactory } from '@modules/user-license/testing';
import { Test, type TestingModule } from '@nestjs/testing';
import { ExternalToolMetadataUpdateFailedLoggable, ExternalToolProvisioningFailedLoggable } from '../../../loggable';
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
				{ provide: ExternalToolService, useValue: createMock<ExternalToolService>() },
				{ provide: SchoolExternalToolService, useValue: createMock<SchoolExternalToolService>() },
				{ provide: MediaUserLicenseService, useValue: createMock<MediaUserLicenseService>() },
				{ provide: MediaSchoolLicenseService, useValue: createMock<MediaSchoolLicenseService>() },
				{ provide: SchoolSystemOptionsService, useValue: createMock<SchoolSystemOptionsService>() },
				{ provide: ExternalToolValidationService, useValue: createMock<ExternalToolValidationService>() },
				{ provide: MediumMetadataService, useValue: createMock<MediumMetadataService>() },
				{ provide: ExternalToolMetadataUpdateService, useValue: createMock<ExternalToolMetadataUpdateService>() },
				{ provide: Logger, useValue: createMock<Logger>() },
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

	type Scenario = {
		userId: string;
		schoolId: string;
		systemId: string;
		license: MediaUserLicense;
		externalTool: ExternalTool;
	};

	const createActiveExternalTool = (license: MediaUserLicense): ExternalTool =>
		externalToolFactory
			.withMedium({
				mediumId: license.mediumId,
				mediaSourceId: license.mediaSource?.sourceId,
				status: ExternalToolMediumStatus.ACTIVE,
			})
			.build({ parameters: [] });

	const createScenario = (overrides: Partial<Scenario> = {}): Scenario => {
		const userId = new ObjectId().toHexString();
		const schoolId = new ObjectId().toHexString();
		const systemId = new ObjectId().toHexString();
		const license = mediaUserLicenseFactory.build({ userId });
		const externalTool = createActiveExternalTool(license);
		const scenario: Scenario = { userId, schoolId, systemId, license, externalTool, ...overrides };
		const { provisioningOptions } = schoolSystemOptionsFactory.build({
			provisioningOptions: { schoolExternalToolProvisioningEnabled: true },
		});

		schoolSystemOptionsService.getProvisioningOptions.mockResolvedValue(provisioningOptions);
		mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValue([scenario.license]);
		mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValue([]);
		externalToolService.findExternalToolByMedium.mockResolvedValue(scenario.externalTool);
		externalToolService.createExternalTool.mockImplementation((tool) => Promise.resolve(tool));
		externalToolValidationService.validateCreate.mockResolvedValue();
		schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([]);
		schoolExternalToolService.saveSchoolExternalTool.mockImplementation((tool) => Promise.resolve(tool));

		return scenario;
	};

	const provision = (scenario: Scenario): Promise<void> =>
		service.provisionSchoolExternalTools(scenario.userId, scenario.schoolId, scenario.systemId);

	describe('provisionSchoolExternalTools', () => {
		describe('when provisioning is disabled', () => {
			const createDisabledScenario = (): Scenario => {
				const scenario = createScenario();
				const { provisioningOptions } = schoolSystemOptionsFactory.build({});
				schoolSystemOptionsService.getProvisioningOptions.mockResolvedValue(provisioningOptions);
				return scenario;
			};

			it('should not load user licenses', async () => {
				const scenario = createDisabledScenario();

				await provision(scenario);

				expect(mediaUserLicenseService.getMediaUserLicensesForUser).not.toHaveBeenCalled();
			});

			it('should not load school licenses', async () => {
				const scenario = createDisabledScenario();

				await provision(scenario);

				expect(mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId).not.toHaveBeenCalled();
			});

			it('should not search for external tools', async () => {
				const scenario = createDisabledScenario();

				await provision(scenario);

				expect(externalToolService.findExternalToolByMedium).not.toHaveBeenCalled();
			});
		});

		describe('when no licenses are available', () => {
			const createNoLicenseScenario = (): Scenario => {
				const scenario = createScenario();
				mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValue([]);
				return scenario;
			};

			it('should not search for external tools', async () => {
				const scenario = createNoLicenseScenario();

				await provision(scenario);

				expect(externalToolService.findExternalToolByMedium).not.toHaveBeenCalled();
			});

			it('should not create a school external tool', async () => {
				const scenario = createNoLicenseScenario();

				await provision(scenario);

				expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when an active external tool exists', () => {
			it('should create a school external tool', async () => {
				const scenario = createScenario();

				await provision(scenario);

				expect(schoolExternalToolService.saveSchoolExternalTool).toHaveBeenCalledWith(
					expect.objectContaining({
						toolId: scenario.externalTool.id,
						schoolId: scenario.schoolId,
						isDeactivated: false,
						parameters: [],
					})
				);
			});

			describe('when a school external tool already exists', () => {
				it('should not create a duplicate school external tool', async () => {
					const scenario = createScenario();
					const existingSchoolExternalTool = schoolExternalToolFactory.build({
						schoolId: scenario.schoolId,
						toolId: scenario.externalTool.id,
					});
					schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([existingSchoolExternalTool]);

					await provision(scenario);

					expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
				});
			});

			describe('when an inactive external tool exists', () => {
				const createInactiveToolScenario = (): Scenario => {
					const scenario = createScenario();
					if (scenario.externalTool.medium) {
						scenario.externalTool.medium.status = ExternalToolMediumStatus.DRAFT;
					}
					externalToolService.findExternalToolByMedium.mockResolvedValue(scenario.externalTool);
					return scenario;
				};

				it('should not save a school external tool', async () => {
					const scenario = createInactiveToolScenario();

					await provision(scenario);

					expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
				});

				it('should log a provisioning failure', async () => {
					const scenario = createInactiveToolScenario();

					await provision(scenario);

					expect(logger.warning).toHaveBeenCalledWith(expect.any(ExternalToolProvisioningFailedLoggable));
				});
			});

			describe('when the tool has non-global parameters', () => {
				const createNonGlobalParameterScenario = (): Scenario => {
					const scenario = createScenario({
						externalTool: externalToolFactory
							.withMedium({
								mediumId: 'medium-id',
								mediaSourceId: 'media-source-id',
								status: ExternalToolMediumStatus.ACTIVE,
							})
							.build({ parameters: [customParameterFactory.build({ scope: CustomParameterScope.SCHOOL })] }),
					});
					externalToolService.findExternalToolByMedium.mockResolvedValue(scenario.externalTool);
					return scenario;
				};

				it('should not save a school external tool', async () => {
					const scenario = createNonGlobalParameterScenario();

					await provision(scenario);

					expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
				});

				it('should log a provisioning failure', async () => {
					const scenario = createNonGlobalParameterScenario();

					await provision(scenario);

					expect(logger.warning).toHaveBeenCalledWith(expect.any(ExternalToolProvisioningFailedLoggable));
				});
			});
		});

		describe('when creating an external tool from a template', () => {
			const createTemplateScenario = (format?: MediaSourceDataFormat) => {
				const mediaSource = mediaSourceFactory.build({ sourceId: 'media-source-id', format });
				const license = mediaUserLicenseFactory.build({
					mediaSource,
					mediumId: 'medium-id',
				});
				const template = externalToolFactory
					.withFileRecordRef()
					.withMedium({ mediaSourceId: mediaSource.sourceId, status: ExternalToolMediumStatus.TEMPLATE })
					.build();
				const scenario = createScenario({ license, externalTool: template });

				externalToolService.findExternalToolByMedium.mockResolvedValue(null);
				externalToolService.findTemplate.mockResolvedValue(template);
				return { scenario, template, mediaSource };
			};

			describe('when metadata is available', () => {
				const createMetadataAvailableScenario = () => {
					const { scenario, mediaSource } = createTemplateScenario(MediaSourceDataFormat.VIDIS);
					const metadata = mediumMetadataDtoFactory.build({ name: 'Updated tool name' });
					mediumMetadataService.getMetadataItem.mockResolvedValue(metadata);
					externalToolMetadataUpdateService.updateExternalToolWithMetadata.mockImplementation((tool) => {
						tool.name = metadata.name;
						return Promise.resolve();
					});
					return { scenario, mediaSource, metadata };
				};

				it('should create an active external tool', async () => {
					const { scenario, mediaSource, metadata } = createMetadataAvailableScenario();

					await provision(scenario);

					const [createdTool] = externalToolService.createExternalTool.mock.calls[0];
					expect(createdTool).toEqual(
						expect.objectContaining({
							name: metadata.name,
							medium: expect.objectContaining({
								mediumId: scenario.license.mediumId,
								mediaSourceId: mediaSource.sourceId,
								status: ExternalToolMediumStatus.ACTIVE,
							}),
						})
					);
				});

				it('should create a school external tool', async () => {
					const { scenario } = createMetadataAvailableScenario();

					await provision(scenario);

					expect(schoolExternalToolService.saveSchoolExternalTool).toHaveBeenCalled();
				});
			});

			describe('when metadata loading fails', () => {
				const createMetadataFailureScenario = () => {
					const { scenario, template } = createTemplateScenario(MediaSourceDataFormat.VIDIS);
					const error = new Error('metadata unavailable');
					mediumMetadataService.getMetadataItem.mockRejectedValue(error);
					return { scenario, template, error };
				};

				it('should create a draft external tool', async () => {
					const { scenario } = createMetadataFailureScenario();
					const { mediaSource } = scenario.license;
					const mediaSourceId = mediaSource?.sourceId ?? '-';

					await provision(scenario);

					const [createdTool] = externalToolService.createExternalTool.mock.calls[0];
					expect(createdTool).toEqual(
						expect.objectContaining({
							name: `Draft: ${mediaSourceId} ${scenario.license.mediumId}`,
							medium: expect.objectContaining({ status: ExternalToolMediumStatus.DRAFT }),
						})
					);
				});

				it('should log a metadata update warning', async () => {
					const { scenario, error } = createMetadataFailureScenario();

					await provision(scenario);

					expect(logger.warning).toHaveBeenCalledWith(
						new ExternalToolMetadataUpdateFailedLoggable(
							expect.any(ExternalTool) as unknown as ExternalTool,
							scenario.license,
							error
						)
					);
				});

				it('should not create a school external tool', async () => {
					const { scenario } = createMetadataFailureScenario();

					await provision(scenario);

					expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
				});

				it('should keep the created tool in draft status', async () => {
					const { scenario, template } = createMetadataFailureScenario();

					await provision(scenario);

					expect(template.medium?.status).toBe(ExternalToolMediumStatus.DRAFT);
				});
			});

			describe('when the template is missing', () => {
				const createMissingTemplateScenario = (): Scenario => {
					const { scenario } = createTemplateScenario();
					externalToolService.findTemplate.mockResolvedValue(null);
					return scenario;
				};

				it('should not create an external tool', async () => {
					const scenario = createMissingTemplateScenario();

					await provision(scenario);

					expect(externalToolService.createExternalTool).not.toHaveBeenCalled();
				});

				it('should not create a school external tool', async () => {
					const scenario = createMissingTemplateScenario();

					await provision(scenario);

					expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
				});

				it('should log a provisioning failure', async () => {
					const scenario = createMissingTemplateScenario();

					await provision(scenario);

					expect(logger.warning).toHaveBeenCalledWith(expect.any(ExternalToolProvisioningFailedLoggable));
				});
			});

			describe('when the template has no medium', () => {
				const createTemplateWithoutMediumScenario = (): Scenario => {
					const { scenario } = createTemplateScenario();
					externalToolService.findTemplate.mockResolvedValue(externalToolFactory.build({ medium: undefined }));
					return scenario;
				};

				it('should not create an external tool', async () => {
					const scenario = createTemplateWithoutMediumScenario();

					await provision(scenario);

					expect(externalToolService.createExternalTool).not.toHaveBeenCalled();
				});

				it('should not create a school external tool', async () => {
					const scenario = createTemplateWithoutMediumScenario();

					await provision(scenario);

					expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
				});
			});

			describe('when validation fails', () => {
				const createValidationFailureScenario = (): Scenario => {
					const { scenario } = createTemplateScenario();
					externalToolValidationService.validateCreate.mockRejectedValue(new Error('invalid tool'));
					return scenario;
				};

				it('should not create an external tool', async () => {
					const scenario = createValidationFailureScenario();

					await provision(scenario);

					expect(externalToolService.createExternalTool).not.toHaveBeenCalled();
				});

				it('should not create a school external tool', async () => {
					const scenario = createValidationFailureScenario();

					await provision(scenario);

					expect(schoolExternalToolService.saveSchoolExternalTool).not.toHaveBeenCalled();
				});

				it('should log a provisioning failure', async () => {
					const scenario = createValidationFailureScenario();

					await provision(scenario);

					expect(logger.warning).toHaveBeenCalledWith(expect.any(ExternalToolProvisioningFailedLoggable));
				});
			});
		});

		describe('processing multiple licenses', () => {
			it('should provision different media with the same name', async () => {
				const scenario = createScenario();
				const secondLicense = mediaSchoolLicenseFactory.build({
					schoolId: scenario.schoolId,
					mediumId: 'second-medium-id',
					mediaSource: mediaSourceFactory.build({ sourceId: 'second-media-source-id' }),
				});
				const secondTool = createActiveExternalTool(secondLicense as unknown as MediaUserLicense);
				scenario.externalTool.name = 'same medium name';
				secondTool.name = scenario.externalTool.name;
				mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValue([secondLicense]);
				externalToolService.findExternalToolByMedium.mockImplementation((mediumId) => {
					if (mediumId === scenario.license.mediumId) {
						return Promise.resolve(scenario.externalTool);
					}
					return Promise.resolve(secondTool);
				});

				await provision(scenario);

				expect(schoolExternalToolService.saveSchoolExternalTool).toHaveBeenCalledTimes(2);
				expect(schoolExternalToolService.saveSchoolExternalTool).toHaveBeenCalledWith(
					expect.objectContaining({ toolId: scenario.externalTool.id, schoolId: scenario.schoolId })
				);
				expect(schoolExternalToolService.saveSchoolExternalTool).toHaveBeenCalledWith(
					expect.objectContaining({ toolId: secondTool.id, schoolId: scenario.schoolId })
				);
			});

			describe('when one license fails', () => {
				const createPartialFailureScenario = (): { scenario: Scenario; secondTool: ExternalTool } => {
					const scenario = createScenario();
					const secondLicense = mediaSchoolLicenseFactory.build();
					const secondTool = createActiveExternalTool(secondLicense as unknown as MediaUserLicense);
					mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValue([secondLicense]);
					externalToolService.findExternalToolByMedium.mockImplementation((mediumId) => {
						if (mediumId === scenario.license.mediumId) {
							return Promise.reject(new Error('lookup failed'));
						}
						return Promise.resolve(secondTool);
					});
					return { scenario, secondTool };
				};

				it('should save the successfully provisioned school external tool', async () => {
					const { scenario, secondTool } = createPartialFailureScenario();

					await provision(scenario);

					expect(schoolExternalToolService.saveSchoolExternalTool).toHaveBeenCalledTimes(1);
					expect(schoolExternalToolService.saveSchoolExternalTool).toHaveBeenCalledWith(
						expect.objectContaining({ toolId: secondTool.id, schoolId: scenario.schoolId })
					);
				});

				it('should log a provisioning failure for the failed license', async () => {
					const { scenario } = createPartialFailureScenario();

					await provision(scenario);

					expect(logger.warning).toHaveBeenCalledWith(expect.any(ExternalToolProvisioningFailedLoggable));
				});
			});
		});
	});
});
