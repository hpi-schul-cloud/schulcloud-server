import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ContextExternalToolNameAlreadyExistsLoggableException } from '@modules/tool/common/domain';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common';
import { CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { externalToolFactory } from '../../external-tool/testing';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ContextExternalTool } from '../domain';
import { contextExternalToolFactory } from '../testing';
import { ContextExternalToolValidationService } from './context-external-tool-validation.service';
import { ContextExternalToolService } from './context-external-tool.service';

describe('ContextExternalToolValidationService', () => {
	let module: TestingModule;
	let service: ContextExternalToolValidationService;

	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let commonToolValidationService: DeepMocked<CommonToolValidationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ContextExternalToolValidationService,
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
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
		contextExternalToolService = module.get(ContextExternalToolService);
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
		describe('when no tool with the name exists in the context', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();
				externalToolService.findById.mockResolvedValue(externalTool);

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					displayName: 'Tool 1',
				});
				contextExternalToolService.findContextExternalTools.mockResolvedValue([
					contextExternalToolFactory.buildWithId({ displayName: 'Tool 2' }),
				]);
				commonToolValidationService.validateParameters.mockReturnValue([]);

				return {
					externalTool,
					contextExternalTool,
				};
			};

			it('should call contextExternalToolService.findContextExternalTools', async () => {
				const { contextExternalTool } = setup();

				await service.validate(contextExternalTool);

				expect(contextExternalToolService.findContextExternalTools).toBeCalledWith({
					schoolToolRef: contextExternalTool.schoolToolRef,
					context: contextExternalTool.contextRef,
				});
			});

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

			it('should not throw UnprocessableEntityException', async () => {
				const { contextExternalTool } = setup();

				const func = () => service.validate(contextExternalTool);

				await expect(func()).resolves.not.toThrowError(UnprocessableEntityException);
			});
		});

		describe('when a tool with the same name already exists in that context', () => {
			describe('when the displayName is undefined', () => {
				const setup = () => {
					const contextExternalTool1 = contextExternalToolFactory.buildWithId({ displayName: undefined });
					const contextExternalTool2 = contextExternalToolFactory.buildWithId({ displayName: undefined });

					contextExternalToolService.findContextExternalTools.mockResolvedValue([contextExternalTool2]);

					return {
						contextExternalTool1,
					};
				};

				it('should throw ValidationError', async () => {
					const { contextExternalTool1 } = setup();

					const func = () => service.validate(contextExternalTool1);

					await expect(func()).rejects.toThrowError(
						new ContextExternalToolNameAlreadyExistsLoggableException(
							contextExternalTool1.id,
							contextExternalTool1.displayName
						)
					);
				});
			});

			describe('when the displayName is the same', () => {
				const setup = () => {
					const contextExternalTool1 = contextExternalToolFactory.buildWithId({ displayName: 'Existing Tool' });
					const contextExternalTool2 = contextExternalToolFactory.buildWithId({ displayName: 'Existing Tool' });

					contextExternalToolService.findContextExternalTools.mockResolvedValue([contextExternalTool2]);

					return {
						contextExternalTool1,
					};
				};

				it('should throw ValidationError', async () => {
					const { contextExternalTool1 } = setup();

					const func = () => service.validate(contextExternalTool1);

					await expect(func()).rejects.toThrowError(
						new ContextExternalToolNameAlreadyExistsLoggableException(
							contextExternalTool1.id,
							contextExternalTool1.displayName
						)
					);
				});
			});
		});

		describe('when the parameter validation fails', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					displayName: 'Tool 1',
				});

				const error: ValidationError = new ValidationError('');

				externalToolService.findById.mockResolvedValue(externalTool);
				contextExternalToolService.findContextExternalTools.mockResolvedValue([
					contextExternalToolFactory.buildWithId({ displayName: 'Tool 2' }),
				]);
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
