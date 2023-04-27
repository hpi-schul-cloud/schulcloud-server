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

	describe('createContextExternalTool is called', () => {
		const setup = () => {
			const contextExternalTool1: ContextExternalToolDO = contextExternalToolDOFactory.build();

			contextExternalToolRepo.save.mockResolvedValue(contextExternalTool1);

			return {
				contextExternalTool1,
			};
		};

		describe('when contextExternalTool is given', () => {
			it('should call contextExternalToolRepo ', async () => {
				const { contextExternalTool1 } = setup();

				await service.createContextExternalTool(contextExternalTool1);

				expect(contextExternalToolRepo).toHaveBeenCalledWith(contextExternalTool1);
			});
		});
	});
});
