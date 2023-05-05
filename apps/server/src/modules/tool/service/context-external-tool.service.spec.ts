import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ContextExternalToolRepo } from '@shared/repo/contextexternaltool/context-external-tool.repo';
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

		describe('when schoolExternalToolId is given', () => {
			it('should call find()', async () => {
				const { schoolExternalToolId } = setup();
				await service.deleteBySchoolExternalToolId(schoolExternalToolId);

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

	describe('getContextExternalToolById is called', () => {
		const setup = () => {
			const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.build();

			return {
				contextExternalToolId: contextExternalTool.id as string,
			};
		};

		describe('when contextExternalToolId is given', () => {
			it('should call getContextExternalToolById()', async () => {
				const { contextExternalToolId } = setup();

				await service.getContextExternalToolById(contextExternalToolId);

				expect(contextExternalToolRepo.findById).toHaveBeenCalledWith(contextExternalToolId);
			});
		});
	});

	describe('deleteContextExternalToolById is called', () => {
		const setup = () => {
			const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.build();

			return {
				contextExternalToolId: contextExternalTool.id as string,
			};
		};

		describe('when contextExternalToolId is given', () => {
			it('should call deleteContextExternalToolById()', async () => {
				const { contextExternalToolId } = setup();

				await service.deleteContextExternalToolById(contextExternalToolId);

				expect(contextExternalToolRepo.deleteById).toHaveBeenCalledWith(contextExternalToolId);
			});
		});
	});

	describe('createContextExternalTool is called', () => {
		const setup = () => {
			const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.build();

			return {
				contextExternalTool,
			};
		};

		describe('when contextExternalTool is given', () => {
			it('should call contextExternalToolRepo ', async () => {
				const { contextExternalTool } = setup();

				await service.createContextExternalTool(contextExternalTool);

				expect(contextExternalToolRepo.save).toHaveBeenCalledWith(contextExternalTool);
			});
		});
	});
});
