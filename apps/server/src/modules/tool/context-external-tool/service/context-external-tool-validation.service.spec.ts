import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolDO, ExternalToolDO } from '@shared/domain';
import { contextExternalToolDOFactory, externalToolDOFactory } from '@shared/testing';
import { CommonToolValidationService } from '../../common/service';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalToolService } from '../../school-external-tool/service';
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
		describe('when check duplication of contextExternalTool is successfully ', () => {
			const setup = () => {
				const externalTool: ExternalToolDO = externalToolDOFactory.buildWithId();
				externalToolService.findExternalToolById.mockResolvedValue(externalTool);

				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.buildWithId();
				contextExternalToolService.findContextExternalTools.mockResolvedValue([]);

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

				expect(schoolExternalToolService.getSchoolExternalToolById).toBeCalledWith(
					contextExternalTool.schoolToolRef.schoolToolId
				);
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

				await expect(func()).resolves.not.toThrowError(new UnprocessableEntityException());
			});
		});

		describe('when check duplication of contextExternalTool failed ', () => {
			const setup = () => {
				const contextExternalTool = contextExternalToolDOFactory.buildWithId();
				contextExternalToolService.findContextExternalTools.mockResolvedValue([contextExternalTool]);

				return {
					contextExternalTool,
				};
			};

			it('should throw UnprocessableEntityException', async () => {
				const { contextExternalTool } = setup();

				const func = () => service.validate(contextExternalTool);

				await expect(func()).rejects.toThrowError(new UnprocessableEntityException('Tool is already assigned.'));
			});
		});
	});
});
