import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ValidationError } from '@mikro-orm/core';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { contextExternalToolFactory, externalToolFactory } from '@shared/testing';
import { CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ContextExternalTool } from '../domain';
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

				expect(commonToolValidationService.checkCustomParameterEntries).toBeCalledWith(
					externalTool,
					contextExternalTool
				);
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
						new ValidationError(
							'tool_with_name_exists: A tool with the same name is already assigned to this course. Tool names must be unique within a course.'
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
						new ValidationError(
							'tool_with_name_exists: A tool with the same name is already assigned to this course. Tool names must be unique within a course.'
						)
					);
				});
			});
		});
	});
});
