import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolRepo } from '@shared/repo';
import {
	contextExternalToolFactory,
	schoolDOFactory,
	schoolExternalToolFactory,
} from '@shared/testing/factory/domainobject';
import { AuthorizationService } from '@src/modules/authorization';
import { ToolContextType } from '../../common/enum';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ContextExternalTool, ContextRef } from '../domain';
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
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		service = module.get(ContextExternalToolService);
		contextExternalToolRepo = module.get(ContextExternalToolRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('findContextExternalTools is called', () => {
		describe('when query is given', () => {
			const setup = () => {
				const contextExternalTools: ContextExternalTool[] = contextExternalToolFactory.buildList(2);

				contextExternalToolRepo.find.mockResolvedValue(contextExternalTools);

				return {
					contextExternalTools,
				};
			};

			it('should return an array of contextExternalTools', async () => {
				const { contextExternalTools } = setup();

				const result: ContextExternalTool[] = await service.findContextExternalTools({});

				expect(result).toEqual(contextExternalTools);
			});
		});
	});

	describe('deleteBySchoolExternalToolId is called', () => {
		describe('when schoolExternalToolId is given', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const schoolExternalToolId = schoolExternalTool.id as string;
				const contextExternalTool1: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalToolId)
					.buildWithId();
				const contextExternalTool2: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalToolId)
					.buildWithId();
				contextExternalToolRepo.find.mockResolvedValueOnce([contextExternalTool1, contextExternalTool2]);

				return {
					schoolExternalTool,
					schoolExternalToolId,
					contextExternalTool1,
					contextExternalTool2,
				};
			};

			it('should call find()', async () => {
				const { schoolExternalToolId } = setup();

				await service.deleteBySchoolExternalToolId(schoolExternalToolId);

				expect(contextExternalToolRepo.find).toHaveBeenCalledWith({
					schoolToolRef: { schoolToolId: schoolExternalToolId },
				});
			});

			it('should call deleteBySchoolExternalToolIds()', async () => {
				const { schoolExternalToolId, contextExternalTool1, contextExternalTool2 } = setup();

				await service.deleteBySchoolExternalToolId(schoolExternalToolId);

				expect(contextExternalToolRepo.delete).toHaveBeenCalledWith([contextExternalTool1, contextExternalTool2]);
			});
		});
	});

	describe('saveContextExternalTool is called', () => {
		describe('when contextExternalTool is given', () => {
			const setup = () => {
				jest.useFakeTimers().setSystemTime(new Date('2023-01-01'));
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

				return {
					contextExternalTool,
				};
			};

			it('should call contextExternalToolRepo ', async () => {
				const { contextExternalTool } = setup();

				await service.saveContextExternalTool(contextExternalTool);

				expect(contextExternalToolRepo.save).toHaveBeenCalledWith(contextExternalTool);
			});
		});
	});

	describe('getContextExternalToolById is called', () => {
		describe('when contextExternalToolId is given', () => {
			const setup = () => {
				const schoolId: string = schoolDOFactory.buildWithId().id as string;
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					schoolId,
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string, schoolExternalTool.schoolId)
					.build();

				contextExternalToolRepo.findById.mockResolvedValue(contextExternalTool);

				return {
					contextExternalTool,
				};
			};

			it('should return a contextExternalTool', async () => {
				const { contextExternalTool } = setup();

				const result: ContextExternalTool = await service.getContextExternalToolById(contextExternalTool.id as string);

				expect(result).toEqual(contextExternalTool);
			});
		});

		describe('when contextExternalTool could not be found', () => {
			const setup = () => {
				contextExternalToolRepo.findById.mockRejectedValue(new NotFoundException());
			};

			it('should throw a not found exception', async () => {
				setup();

				const func = () => service.getContextExternalToolById('unknownContextExternalToolId');

				await expect(func()).rejects.toThrow(NotFoundException);
			});
		});
	});

	describe('deleteContextExternalTool is called', () => {
		describe('when contextExternalToolId is given', () => {
			const setup = () => {
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

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

	describe('getContextExternalToolsForContext is called', () => {
		describe('when contextType and contextId are given', () => {
			it('should call the repository', async () => {
				const contextRef: ContextRef = new ContextRef({ type: ToolContextType.COURSE, id: 'contextId' });
				await service.findAllByContext(contextRef);

				expect(contextExternalToolRepo.find).toHaveBeenCalledWith({
					context: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				});
			});

			it('should return context external tools', async () => {
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();
				contextExternalToolRepo.find.mockResolvedValue([contextExternalTool]);

				const result: ContextExternalTool[] = await service.findAllByContext(contextExternalTool.contextRef);

				expect(result).toEqual([contextExternalTool]);
			});
		});
	});
});
