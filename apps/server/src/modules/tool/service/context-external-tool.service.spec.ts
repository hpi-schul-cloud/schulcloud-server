import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ContextExternalToolRepo } from '@shared/repo';
import { contextExternalToolDOFactory, schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/';
import { ContextExternalToolDO, SchoolExternalToolDO } from '@shared/domain';
import { ContextExternalToolService } from './context-external-tool.service';

describe('ContextExternalToolService', () => {
	let module: TestingModule;
	let service: ContextExternalToolService;

	let contextExternalToolRepo: DeepMocked<ContextExternalToolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ContextExternalToolService,
				{
					provide: ContextExternalToolRepo,
					useValue: createMock<ContextExternalToolRepo>(),
				},
			],
		}).compile();

		service = module.get(ContextExternalToolService);
		contextExternalToolRepo = module.get(ContextExternalToolRepo);
	});

	describe('deleteBySchoolExternalToolId is called', () => {
		describe('when schoolExternalToolId is given', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalToolDO = schoolExternalToolDOFactory.build();
				const contextExternalTool1: ContextExternalToolDO = contextExternalToolDOFactory.build();
				const contextExternalTool2: ContextExternalToolDO = contextExternalToolDOFactory.build();

				return {
					schoolExternalTool,
					schoolExternalToolId: schoolExternalTool.id as string,
					contextExternalTool1,
					contextExternalTool2,
				};
			};

			it('should call find()', async () => {
				const { schoolExternalToolId, contextExternalTool1, contextExternalTool2 } = setup();

				await service.deleteBySchoolExternalToolId(schoolExternalToolId);
				contextExternalToolRepo.find.mockResolvedValue([contextExternalTool1, contextExternalTool2]);

				expect(contextExternalToolRepo.find).toHaveBeenCalledWith({ schoolToolId: schoolExternalToolId });
			});

			it('should call deleteBySchoolExternalToolIds()', async () => {
				const { schoolExternalToolId, contextExternalTool1, contextExternalTool2 } = setup();
				contextExternalToolRepo.find.mockResolvedValue([contextExternalTool1, contextExternalTool2]);

				await service.deleteBySchoolExternalToolId(schoolExternalToolId);

				expect(contextExternalToolRepo.delete).toHaveBeenCalledWith([contextExternalTool1.id, contextExternalTool2.id]);
			});
		});
	});

	describe('createContextExternalTool is called', () => {
		describe('when contextExternalTool is given', () => {
			const setup = () => {
				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.build();

				return {
					contextExternalTool,
				};
			};

			it('should call contextExternalToolRepo ', async () => {
				const { contextExternalTool } = setup();

				await service.createContextExternalTool(contextExternalTool);

				expect(contextExternalToolRepo.save).toHaveBeenCalledWith(contextExternalTool);
			});
		});
	});

	describe('getContextExternalToolById is called', () => {
		describe('when contextExternalToolId is given', () => {
			const setup = () => {
				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.build();

				contextExternalToolRepo.findById.mockResolvedValue(contextExternalTool);

				return {
					contextExternalTool,
				};
			};

			it('should return a contextExternalTool', async () => {
				const { contextExternalTool } = setup();

				const result: ContextExternalToolDO = await service.getContextExternalToolById(
					contextExternalTool.id as string
				);

				expect(result).toEqual(contextExternalTool);
			});
		});
	});

	describe('deleteContextExternalTool is called', () => {
		describe('when contextExternalToolId is given', () => {
			const setup = () => {
				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.build();

				return {
					contextExternalTool,
				};
			};

			it('should call delete on repo', async () => {
				const { contextExternalTool } = setup();

				await service.deleteContextExternalTool(contextExternalTool);

				expect(contextExternalToolRepo.delete).toHaveBeenCalledWith(contextExternalTool);
			});
		});
	});
});
