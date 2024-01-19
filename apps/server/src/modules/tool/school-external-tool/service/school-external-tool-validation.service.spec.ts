import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common';
import { externalToolFactory, schoolExternalToolFactory } from '@shared/testing';
import { CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { SchoolExternalTool } from '../domain';
import { SchoolExternalToolValidationService } from './school-external-tool-validation.service';

describe(SchoolExternalToolValidationService.name, () => {
	let module: TestingModule;
	let service: SchoolExternalToolValidationService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let commonToolValidationService: DeepMocked<CommonToolValidationService>;
	let toolFeatures: DeepMocked<IToolFeatures>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolExternalToolValidationService,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: CommonToolValidationService,
					useValue: createMock<CommonToolValidationService>(),
				},
				{
					provide: ToolFeatures,
					useValue: {
						toolStatusWithoutVersions: false,
					},
				},
			],
		}).compile();

		service = module.get(SchoolExternalToolValidationService);
		externalToolService = module.get(ExternalToolService);
		commonToolValidationService = module.get(CommonToolValidationService);
		toolFeatures = module.get(ToolFeatures);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('validate', () => {
		describe('when the schoolExternalTool is valid', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({ toolVersion: 1337 });
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ version: 8383 });

				externalToolService.findById.mockResolvedValue(externalTool);
				commonToolValidationService.validateParameters.mockReturnValueOnce([]);
				toolFeatures.toolStatusWithoutVersions = true;

				return {
					schoolExternalTool,
					externalTool,
				};
			};

			it('should call externalToolService.findExternalToolById', async () => {
				const { schoolExternalTool } = setup();

				await service.validate(schoolExternalTool);

				expect(externalToolService.findById).toHaveBeenCalledWith(schoolExternalTool.toolId);
			});

			it('should call commonToolValidationService.checkCustomParameterEntries', async () => {
				const { schoolExternalTool, externalTool } = setup();

				await service.validate(schoolExternalTool);

				expect(commonToolValidationService.validateParameters).toHaveBeenCalledWith(externalTool, schoolExternalTool);
			});

			it('should not throw error', async () => {
				const { schoolExternalTool } = setup();

				await expect(service.validate(schoolExternalTool)).resolves.not.toThrow();
			});
		});

		describe('when the schoolExternalTool is invalid', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const externalTool: ExternalTool = externalToolFactory.buildWithId();
				const error: ValidationError = new ValidationError('');

				externalToolService.findById.mockResolvedValue(externalTool);
				commonToolValidationService.validateParameters.mockReturnValueOnce([error]);
				toolFeatures.toolStatusWithoutVersions = true;

				return {
					schoolExternalTool,
					externalTool,
					error,
				};
			};

			it('should throw an error', async () => {
				const { schoolExternalTool, error } = setup();

				await expect(service.validate(schoolExternalTool)).rejects.toThrow(error);
			});
		});
	});

	// TODO N21-1337 refactor after feature flag is removed
	describe('validate with FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED on false', () => {
		describe('when version of externalTool and schoolExternalTool are different', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({ toolVersion: 1337 });
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ version: 8383 });

				externalToolService.findById.mockResolvedValue(externalTool);
				toolFeatures.toolStatusWithoutVersions = false;

				return {
					schoolExternalTool,
				};
			};

			it('should throw error', async () => {
				const { schoolExternalTool } = setup();

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).rejects.toThrowError('tool_version_mismatch');
			});
		});
	});
});
