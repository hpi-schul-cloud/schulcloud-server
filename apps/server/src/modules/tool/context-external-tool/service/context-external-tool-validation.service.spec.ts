import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common/error';
import { CommonToolValidationService } from '../../common/service';
import { ExternalToolService } from '../../external-tool/service';
import { externalToolFactory } from '../../external-tool/testing';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import { contextExternalToolFactory } from '../testing';
import { ContextExternalToolValidationService } from './context-external-tool-validation.service';

describe('ContextExternalToolValidationService', () => {
	let module: TestingModule;
	let service: ContextExternalToolValidationService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let commonToolValidationService: DeepMocked<CommonToolValidationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ContextExternalToolValidationService,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: CommonToolValidationService,
					useValue: createMock<CommonToolValidationService>(),
				},
			],
		}).compile();

		service = module.get(ContextExternalToolValidationService);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		commonToolValidationService = module.get(CommonToolValidationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('validate', () => {
		describe('when a tool is valid', () => {
			const setup = () => {
				const externalTool = externalToolFactory.build();
				const schoolExternalTool = schoolExternalToolFactory.build({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory.build({
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
					},
					displayName: 'Tool 1',
				});

				schoolExternalToolService.findById.mockResolvedValue(schoolExternalTool);
				externalToolService.findById.mockResolvedValue(externalTool);
				commonToolValidationService.validateParameters.mockReturnValue([]);

				return {
					externalTool,
					contextExternalTool,
				};
			};

			it('should call schoolExternalToolService.getSchoolExternalToolById', async () => {
				const { contextExternalTool } = setup();

				await service.validate(contextExternalTool);

				expect(schoolExternalToolService.findById).toBeCalledWith(contextExternalTool.schoolToolRef.schoolToolId);
			});

			it('should call commonToolValidationService.checkCustomParameterEntries', async () => {
				const { externalTool, contextExternalTool } = setup();

				await service.validate(contextExternalTool);

				expect(commonToolValidationService.validateParameters).toBeCalledWith(externalTool, contextExternalTool);
			});

			it('should not throw', async () => {
				const { contextExternalTool } = setup();

				const func = () => service.validate(contextExternalTool);

				await expect(func()).resolves.not.toThrow();
			});
		});

		describe('when the parameter validation fails', () => {
			const setup = () => {
				const externalTool = externalToolFactory.build();
				const schoolExternalTool = schoolExternalToolFactory.build({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory.build({
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
					},
					displayName: 'Tool 1',
				});

				const error: ValidationError = new ValidationError('');

				schoolExternalToolService.findById.mockResolvedValue(schoolExternalTool);
				externalToolService.findById.mockResolvedValue(externalTool);
				commonToolValidationService.validateParameters.mockReturnValue([error]);

				return {
					externalTool,
					contextExternalTool,
					error,
				};
			};

			it('should throw an error', async () => {
				const { contextExternalTool, error } = setup();

				await expect(service.validate(contextExternalTool)).rejects.toThrow(error);
			});
		});
	});
});
