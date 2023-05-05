import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ContextExternalToolRepo } from '@shared/repo';
import { contextExternalToolDOFactory } from '@shared/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { ContextExternalToolValidationService } from './context-external-tool-validation.service';

describe('ContextExternalToolValidationService', () => {
	let module: TestingModule;
	let service: ContextExternalToolValidationService;

	let contextExternalToolRepo: DeepMocked<ContextExternalToolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ContextExternalToolValidationService,
				{
					provide: ContextExternalToolRepo,
					useValue: createMock<ContextExternalToolRepo>(),
				},
			],
		}).compile();

		service = module.get(ContextExternalToolValidationService);
		contextExternalToolRepo = module.get(ContextExternalToolRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('validate is called', () => {
		describe('when check duplication of contextExternalTool is succesfully ', () => {
			const setup = () => {
				const contextExternalTool = contextExternalToolDOFactory.buildWithId();
				contextExternalToolRepo.find.mockResolvedValue([]);

				return {
					contextExternalTool,
				};
			};

			it('should not throw UnprocessableEntityException', () => {
				const { contextExternalTool } = setup();

				const result = async () => {
					await service.validate(contextExternalTool);
				};

				expect(result).not.toThrowError(new UnprocessableEntityException());
			});
		});

		describe('when check duplication of contextExternalTool failed ', () => {
			const setup = () => {
				const contextExternalTool = contextExternalToolDOFactory.buildWithId();
				contextExternalToolRepo.find.mockResolvedValue([contextExternalTool]);

				return {
					contextExternalTool,
				};
			};

			it('should throw UnprocessableEntityException', async () => {
				const { contextExternalTool } = setup();

				await expect(service.validate(contextExternalTool)).rejects.toThrowError(
					new UnprocessableEntityException('Tool is already assigned.')
				);
			});
		});
	});
});
