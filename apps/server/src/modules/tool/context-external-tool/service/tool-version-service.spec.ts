import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common';
import {
	contextExternalToolFactory,
	customParameterFactory,
	externalToolFactory,
	schoolExternalToolFactory,
} from '@shared/testing';
import {
	ContextExternalToolConfigurationStatus,
	ToolParameterDuplicateLoggableException,
	ToolParameterValueMissingLoggableException,
} from '../../common/domain';
import { CommonToolService, CommonToolValidationService } from '../../common/service';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { ToolVersionService } from './tool-version-service';

describe('ToolVersionService', () => {
	let module: TestingModule;
	let service: ToolVersionService;

	let commonToolValidationService: DeepMocked<CommonToolValidationService>;
	let commonToolService: DeepMocked<CommonToolService>;
	let toolFeatures: DeepMocked<IToolFeatures>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolVersionService,
				{
					provide: CommonToolValidationService,
					useValue: createMock<CommonToolValidationService>(),
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
		commonToolValidationService = module.get(CommonToolValidationService);
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

			it('should call CommonToolService', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

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

				commonToolValidationService.validateParameters.mockReturnValue([]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return latest tool status', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const status: ContextExternalToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: false,
					isOutdatedOnScopeContext: false,
					isIncompleteOnScopeContext: false,
					isDeactivated: false,
				});
			});

			it('should validate the school external tool', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(externalTool, schoolExternalTool);
			});

			it('should validate the context external tool', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(externalTool, contextExternalTool);
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

				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return outdated tool status', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const status: ContextExternalToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: true,
					isOutdatedOnScopeContext: false,
					isIncompleteOnScopeContext: false,
					isDeactivated: false,
				});
			});

			it('should validate the school external tool', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(externalTool, schoolExternalTool);
			});

			it('should validate the context external tool', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(externalTool, contextExternalTool);
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

				commonToolValidationService.validateParameters.mockReturnValueOnce([]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return outdated tool status', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const status: ContextExternalToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: false,
					isOutdatedOnScopeContext: true,
					isIncompleteOnScopeContext: false,
					isDeactivated: false,
				});
			});

			it('should validate the school external tool', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(externalTool, schoolExternalTool);
			});

			it('should validate the context external tool', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(externalTool, contextExternalTool);
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

				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return outdated tool status', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const status: ContextExternalToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: true,
					isOutdatedOnScopeContext: true,
					isIncompleteOnScopeContext: false,
					isDeactivated: false,
				});
			});

			it('should validate the school external tool', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(externalTool, schoolExternalTool);
			});

			it('should validate the context external tool', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				service.determineToolConfigurationStatus(externalTool, schoolExternalTool, contextExternalTool);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(externalTool, contextExternalTool);
			});
		});

		describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is true and validation of ContextExternalTool throws at least 1 missing value errors', () => {
			const setup = () => {
				const customParameter = customParameterFactory.build();
				const externalTool = externalToolFactory.buildWithId({ parameters: [customParameter] });
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id as string,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.buildWithId();

				toolFeatures.toolStatusWithoutVersions = true;

				commonToolValidationService.validateParameters.mockReturnValueOnce([]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([
					new ToolParameterValueMissingLoggableException(customParameter),
					new ToolParameterDuplicateLoggableException(customParameter.name),
				]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return incomplete as tool status', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const status: ContextExternalToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: false,
					isOutdatedOnScopeContext: true,
					isIncompleteOnScopeContext: true,
					isDeactivated: false,
				});
			});
		});

		describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is true and  SchoolExternalTool is deactivated', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id as string,
					status: { isDeactivated: true },
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.buildWithId();

				toolFeatures.toolStatusWithoutVersions = true;

				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return status is deactivated', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const status: ContextExternalToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: true,
					isOutdatedOnScopeContext: true,
					isIncompleteOnScopeContext: false,
					isDeactivated: true,
				});
			});
		});

		describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is true and  externalTool is deactivated', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId({ isDeactivated: true });
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id as string,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.buildWithId();

				toolFeatures.toolStatusWithoutVersions = true;

				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return deactivated tool status', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const status: ContextExternalToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: true,
					isOutdatedOnScopeContext: true,
					isIncompleteOnScopeContext: false,
					isDeactivated: true,
				});
			});
		});

		describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is true,  externalTool and schoolExternalTool are not deactivated', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id as string,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.buildWithId();

				toolFeatures.toolStatusWithoutVersions = true;

				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return deactivated tool status', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const status: ContextExternalToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(status).toEqual<ContextExternalToolConfigurationStatus>({
					isOutdatedOnScopeSchool: true,
					isOutdatedOnScopeContext: true,
					isIncompleteOnScopeContext: false,
					isDeactivated: false,
				});
			});
		});
	});
});
