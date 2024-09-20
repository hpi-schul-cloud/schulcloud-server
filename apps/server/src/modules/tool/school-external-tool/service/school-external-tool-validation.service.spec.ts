import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common';
import { CommonToolValidationService } from '../../common/service';
import { ToolContextType } from '../../common/enum';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { externalToolFactory } from '../../external-tool/testing';
import { SchoolExternalTool } from '../domain';
import { SchoolExternalToolInvalidAvailableContextsException } from '../domain/error';
import { schoolExternalToolFactory } from '../testing';
import { SchoolExternalToolValidationService } from './school-external-tool-validation.service';

describe(SchoolExternalToolValidationService.name, () => {
	let module: TestingModule;
	let service: SchoolExternalToolValidationService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let commonToolValidationService: DeepMocked<CommonToolValidationService>;

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
			],
		}).compile();

		service = module.get(SchoolExternalToolValidationService);
		externalToolService = module.get(ExternalToolService);
		commonToolValidationService = module.get(CommonToolValidationService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('validate', () => {
		describe('when the schoolExternalTool is valid', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				externalToolService.findById.mockResolvedValue(externalTool);
				commonToolValidationService.validateParameters.mockReturnValueOnce([]);

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

	describe('validateAvailableContexts', () => {
		describe('when the school external tool has valid available contexts', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					availableContexts: [ToolContextType.COURSE],
				});

				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					id: schoolExternalTool.toolId,
					restrictToContexts: [ToolContextType.COURSE, ToolContextType.MEDIA_BOARD],
				});

				externalToolService.findById.mockResolvedValue(externalTool);

				return {
					schoolExternalTool,
				};
			};

			it('should not throw an validation error', async () => {
				const { schoolExternalTool } = setup();

				const promise = service.validateAvailableContexts(schoolExternalTool);

				await expect(promise).resolves.not.toThrow();
			});
		});

		describe('when the school external tool has invalid available contexts', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					availableContexts: [ToolContextType.BOARD_ELEMENT],
				});

				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					id: schoolExternalTool.toolId,
					restrictToContexts: [ToolContextType.COURSE, ToolContextType.MEDIA_BOARD],
				});

				externalToolService.findById.mockResolvedValue(externalTool);

				return {
					schoolExternalTool,
				};
			};

			it('should throw an validation error', async () => {
				const { schoolExternalTool } = setup();

				const promise = service.validateAvailableContexts(schoolExternalTool);

				await expect(promise).rejects.toThrow(SchoolExternalToolInvalidAvailableContextsException);
			});
		});
	});
});
