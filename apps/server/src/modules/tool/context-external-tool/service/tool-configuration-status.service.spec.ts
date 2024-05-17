import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common';
import {
	ContextExternalToolConfigurationStatus,
	ToolParameterDuplicateLoggableException,
	ToolParameterMandatoryValueMissingLoggableException,
	ToolParameterOptionalValueMissingLoggableException,
} from '../../common/domain';
import { CommonToolValidationService } from '../../common/service';
import { customParameterFactory, externalToolFactory } from '../../external-tool/testing';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import { contextExternalToolFactory } from '../testing';
import { ToolConfigurationStatusService } from './tool-configuration-status.service';

describe(ToolConfigurationStatusService.name, () => {
	let module: TestingModule;
	let service: ToolConfigurationStatusService;

	let commonToolValidationService: DeepMocked<CommonToolValidationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolConfigurationStatusService,
				{
					provide: CommonToolValidationService,
					useValue: createMock<CommonToolValidationService>(),
				},
			],
		}).compile();

		service = module.get(ToolConfigurationStatusService);
		commonToolValidationService = module.get(CommonToolValidationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('determineToolConfigurationStatus', () => {
		describe('when validation runs through', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

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
					isIncompleteOperationalOnScopeContext: false,
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

		describe('when validation of SchoolExternalTool throws an error', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

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
					isIncompleteOperationalOnScopeContext: false,
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

		describe('when validation of ContextExternalTool throws an error', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

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
					isIncompleteOperationalOnScopeContext: false,
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

		describe('when validation of SchoolExternalTool and  ContextExternalTool throws an error', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

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
					isIncompleteOperationalOnScopeContext: false,
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

		describe('when validation of ContextExternalTool throws at least 1 missing value on mandatory parameter errors', () => {
			const setup = () => {
				const customParameter = customParameterFactory.build();
				const externalTool = externalToolFactory.buildWithId({ parameters: [customParameter] });
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

				commonToolValidationService.validateParameters.mockReturnValueOnce([]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([
					new ToolParameterMandatoryValueMissingLoggableException(undefined, customParameter),
					new ToolParameterDuplicateLoggableException(undefined, customParameter.name),
					new ToolParameterOptionalValueMissingLoggableException(undefined, customParameter),
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
					isIncompleteOperationalOnScopeContext: false,
					isDeactivated: false,
				});
			});
		});

		describe('when validation of ContextExternalTool throws at least 1 missing value on optional parameter errors', () => {
			const setup = () => {
				const customParameter = customParameterFactory.build();
				const externalTool = externalToolFactory.buildWithId({ parameters: [customParameter] });
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

				commonToolValidationService.validateParameters.mockReturnValueOnce([]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([
					new ToolParameterOptionalValueMissingLoggableException(undefined, customParameter),
					new ToolParameterDuplicateLoggableException(undefined, customParameter.name),
				]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return incomplete operational as tool status', () => {
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
					isIncompleteOperationalOnScopeContext: true,
					isDeactivated: false,
				});
			});
		});

		describe('when validation of ContextExternalTool throws only missing value on optional parameter errors', () => {
			const setup = () => {
				const customParameter = customParameterFactory.build();
				const externalTool = externalToolFactory.buildWithId({ parameters: [customParameter] });
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

				commonToolValidationService.validateParameters.mockReturnValueOnce([]);
				commonToolValidationService.validateParameters.mockReturnValueOnce([
					new ToolParameterOptionalValueMissingLoggableException(undefined, customParameter),
					new ToolParameterOptionalValueMissingLoggableException(undefined, customParameter),
					new ToolParameterOptionalValueMissingLoggableException(undefined, customParameter),
				]);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return incomplete operational as tool status', () => {
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
					isIncompleteOperationalOnScopeContext: true,
					isDeactivated: false,
				});
			});
		});

		describe('when SchoolExternalTool is deactivated', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
					status: { isDeactivated: true },
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

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
					isIncompleteOperationalOnScopeContext: false,
					isDeactivated: true,
				});
			});
		});

		describe('when externalTool is deactivated', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId({ isDeactivated: true });
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

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
					isIncompleteOperationalOnScopeContext: false,
					isDeactivated: true,
				});
			});
		});

		describe('when externalTool and schoolExternalTool are not deactivated', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId();

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
					isIncompleteOperationalOnScopeContext: false,
					isDeactivated: false,
				});
			});
		});
	});
});
