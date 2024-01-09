import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import {
	contextExternalToolFactory,
	externalToolFactory,
	schoolExternalToolFactory,
	schoolToolConfigurationStatusFactory,
	toolConfigurationStatusFactory,
} from '@shared/testing';
import { ContextExternalToolConfigurationStatus } from '../../common/domain';
import { CommonToolService } from '../../common/service';
import { SchoolExternalToolValidationService } from '../../school-external-tool/service';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { ContextExternalToolValidationService } from './context-external-tool-validation.service';
import { ToolVersionService } from './tool-version-service';

describe('ToolVersionService', () => {
	let module: TestingModule;
	let service: ToolVersionService;

	let contextExternalToolValidationService: DeepMocked<ContextExternalToolValidationService>;
	let schoolExternalToolValidationService: DeepMocked<SchoolExternalToolValidationService>;
	let commonToolService: DeepMocked<CommonToolService>;
	let toolFeatures: DeepMocked<IToolFeatures>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolVersionService,
				{
					provide: ContextExternalToolValidationService,
					useValue: createMock<ContextExternalToolValidationService>(),
				},
				{
					provide: SchoolExternalToolValidationService,
					useValue: createMock<SchoolExternalToolValidationService>(),
				},
				{
					provide: CommonToolService,
					useValue: createMock<CommonToolService>(),
				},
				{
					provide: ToolFeatures,
					useValue: {
						toolStatusWithoutVersions: false,
					},
				},
			],
		}).compile();

		service = module.get(ToolVersionService);
		contextExternalToolValidationService = module.get(ContextExternalToolValidationService);
		schoolExternalToolValidationService = module.get(SchoolExternalToolValidationService);
		commonToolService = module.get(CommonToolService);
		toolFeatures = module.get(ToolFeatures);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('determineToolConfigurationStatus', () => {
		describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is false', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id as string,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.buildWithId();

				toolFeatures.toolStatusWithoutVersions = false;

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should call CommonToolService', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

				expect(commonToolService.determineToolConfigurationStatus).toHaveBeenCalledWith(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);
			});
		});

		describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is true and validation runs through', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id as string,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.buildWithId();

				toolFeatures.toolStatusWithoutVersions = true;

				schoolExternalToolValidationService.validate.mockResolvedValue();
				contextExternalToolValidationService.validate.mockResolvedValueOnce();

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return latest tool status', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const status: ContextExternalToolConfigurationStatus = await service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(status).toEqual(
					toolConfigurationStatusFactory.build({
						isOutdatedOnScopeContext: false,
						isOutdatedOnScopeSchool: false,
					})
				);
			});

			it('should call schoolExternalToolValidationService', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

				expect(schoolExternalToolValidationService.validate).toHaveBeenCalledWith(schoolExternalTool);
			});

			it('should call contextExternalToolValidationService', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

				expect(schoolExternalToolValidationService.validate).toHaveBeenCalledWith(schoolExternalTool);
			});
		});

		describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is true and validation of SchoolExternalTool throws an error', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id as string,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.buildWithId();

				toolFeatures.toolStatusWithoutVersions = true;

				schoolExternalToolValidationService.validate.mockRejectedValueOnce(ApiValidationError);
				contextExternalToolValidationService.validate.mockResolvedValue();

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return outdated tool status', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const status: ContextExternalToolConfigurationStatus = await service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(status).toEqual(
					toolConfigurationStatusFactory.build({
						isOutdatedOnScopeContext: false,
						isOutdatedOnScopeSchool: true,
					})
				);
			});

			it('should call schoolExternalToolValidationService', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

				expect(schoolExternalToolValidationService.validate).toHaveBeenCalledWith(schoolExternalTool);
			});

			it('should call contextExternalToolValidationService', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

				expect(contextExternalToolValidationService.validate).toHaveBeenCalledWith(contextExternalTool);
			});
		});

		describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is true and validation of ContextExternalTool throws an error', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id as string,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.buildWithId();

				toolFeatures.toolStatusWithoutVersions = true;

				schoolExternalToolValidationService.validate.mockResolvedValue();
				contextExternalToolValidationService.validate.mockRejectedValueOnce(ApiValidationError);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return outdated tool status', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const status: ContextExternalToolConfigurationStatus = await service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(status).toEqual(
					toolConfigurationStatusFactory.build({
						isOutdatedOnScopeContext: true,
						isOutdatedOnScopeSchool: false,
					})
				);
			});

			it('should call schoolExternalToolValidationService', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

				expect(schoolExternalToolValidationService.validate).toHaveBeenCalledWith(schoolExternalTool);
			});

			it('should call contextExternalToolValidationService', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

				expect(contextExternalToolValidationService.validate).toHaveBeenCalledWith(contextExternalTool);
			});
		});

		describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is true and validation of SchoolExternalTool and  ContextExternalTool throws an error', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id as string,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.buildWithId();

				toolFeatures.toolStatusWithoutVersions = true;

				schoolExternalToolValidationService.validate.mockRejectedValueOnce(ApiValidationError);
				contextExternalToolValidationService.validate.mockRejectedValueOnce(ApiValidationError);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return outdated tool status', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const status: ContextExternalToolConfigurationStatus = await service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(status).toEqual(
					toolConfigurationStatusFactory.build({
						isOutdatedOnScopeContext: true,
						isOutdatedOnScopeSchool: true,
					})
				);
			});

			it('should call schoolExternalToolValidationService', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

				expect(schoolExternalToolValidationService.validate).toHaveBeenCalledWith(schoolExternalTool);
			});

			it('should call contextExternalToolValidationService', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				await service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

				expect(contextExternalToolValidationService.validate).toHaveBeenCalledWith(contextExternalTool);
			});
		});

		describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is true and  SchoolExternalTool is deactivated', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id as string,
				});
				schoolExternalTool.status = schoolToolConfigurationStatusFactory.build({ isDeactivated: true });
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.buildWithId();

				toolFeatures.toolStatusWithoutVersions = true;

				schoolExternalToolValidationService.validate.mockRejectedValueOnce(Promise.resolve());
				contextExternalToolValidationService.validate.mockRejectedValueOnce(Promise.resolve());

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return status is deactivated', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const status: ContextExternalToolConfigurationStatus = await service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(status).toEqual(
					toolConfigurationStatusFactory.build({
						isOutdatedOnScopeContext: true,
						isOutdatedOnScopeSchool: true,
						isDeactivated: true,
					})
				);
			});
		});

		describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is true and  externalTool is deactivated', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId({
					isDeactivated: true,
				});
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id as string,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.buildWithId();

				toolFeatures.toolStatusWithoutVersions = true;

				schoolExternalToolValidationService.validate.mockRejectedValueOnce(Promise.resolve());
				contextExternalToolValidationService.validate.mockRejectedValueOnce(Promise.resolve());

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return deactivated tool status', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const status: ContextExternalToolConfigurationStatus = await service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(status).toEqual(
					toolConfigurationStatusFactory.build({
						isOutdatedOnScopeContext: true,
						isOutdatedOnScopeSchool: true,
						isDeactivated: true,
					})
				);
			});
		});

		describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is true,  externalTool and schoolExternalTool are not deactivated', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId({});

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id as string,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.buildWithId();

				toolFeatures.toolStatusWithoutVersions = true;

				schoolExternalToolValidationService.validate.mockRejectedValueOnce(Promise.resolve());
				contextExternalToolValidationService.validate.mockRejectedValueOnce(Promise.resolve());

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return deactivated tool status', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const status: ContextExternalToolConfigurationStatus = await service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(status).toEqual(
					toolConfigurationStatusFactory.build({
						isOutdatedOnScopeContext: true,
						isOutdatedOnScopeSchool: true,
						isDeactivated: false,
					})
				);
			});
		});
	});
});
