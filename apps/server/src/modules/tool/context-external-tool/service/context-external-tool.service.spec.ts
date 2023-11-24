import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolRepo } from '@shared/repo';
import {
	contextExternalToolFactory,
	externalToolFactory,
	legacySchoolDoFactory,
	schoolExternalToolFactory,
} from '@shared/testing/factory/domainobject';
import {
	AuthorizationContext,
	AuthorizationContextBuilder,
	AuthorizationService,
	ForbiddenLoggableException,
} from '@modules/authorization';
import { ObjectId } from '@mikro-orm/mongodb';
import { Permission } from '@shared/domain';
import { ToolContextType } from '../../common/enum';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ContextExternalTool, ContextRef } from '../domain';
import { ContextExternalToolService } from './context-external-tool.service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalToolService } from '../../school-external-tool/service';

describe('ContextExternalToolService', () => {
	let module: TestingModule;
	let service: ContextExternalToolService;
	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;

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
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
			],
		}).compile();

		service = module.get(ContextExternalToolService);
		contextExternalToolRepo = module.get(ContextExternalToolRepo);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('findContextExternalTools', () => {
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

	describe('deleteBySchoolExternalToolId', () => {
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

	describe('saveContextExternalTool', () => {
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

	describe('findById', () => {
		describe('when contextExternalToolId is given', () => {
			const setup = () => {
				const schoolId: string = legacySchoolDoFactory.buildWithId().id as string;
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

				const result: ContextExternalTool = await service.findById(contextExternalTool.id as string);

				expect(result).toEqual(contextExternalTool);
			});
		});

		describe('when contextExternalTool could not be found', () => {
			const setup = () => {
				contextExternalToolRepo.findById.mockRejectedValue(new NotFoundException());
			};

			it('should throw a not found exception', async () => {
				setup();

				const func = () => service.findById('unknownContextExternalToolId');

				await expect(func()).rejects.toThrow(NotFoundException);
			});
		});
	});

	describe('deleteContextExternalTool', () => {
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

	describe('getContextExternalToolsForContext', () => {
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

	describe('checkContextRestrictions', () => {
		describe('when contexts are not restricted', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN]);

				const externalTool: ExternalTool = externalToolFactory.build({ restrictToContexts: [] });
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);

				return {
					userId,
					context,
					contextExternalTool,
					schoolExternalTool,
				};
			};

			it('should find SchoolExternalTool', async () => {
				const { userId, context, contextExternalTool } = setup();

				await service.checkContextRestrictions(contextExternalTool, userId, context);

				expect(schoolExternalToolService.findById).toHaveBeenCalledWith(contextExternalTool.schoolToolRef.schoolToolId);
			});

			it('should find ExternalTool', async () => {
				const { userId, context, contextExternalTool, schoolExternalTool } = setup();

				await service.checkContextRestrictions(contextExternalTool, userId, context);

				expect(externalToolService.findById).toHaveBeenCalledWith(schoolExternalTool.toolId);
			});

			it('should not throw', async () => {
				const { userId, context, contextExternalTool } = setup();

				const func = async () => service.checkContextRestrictions(contextExternalTool, userId, context);

				await expect(func()).resolves.not.toThrow();
			});
		});

		describe('when context is restricted to correct context type', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN]);

				const externalTool: ExternalTool = externalToolFactory.build({ restrictToContexts: [ToolContextType.COURSE] });
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					contextRef: { type: ToolContextType.COURSE },
				});

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);

				return {
					userId,
					context,
					contextExternalTool,
				};
			};

			it('should not throw', async () => {
				const { userId, context, contextExternalTool } = setup();

				const func = async () => service.checkContextRestrictions(contextExternalTool, userId, context);

				await expect(func()).resolves.not.toThrow();
			});
		});

		describe('when context is restricted to wrong context type', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN]);

				const externalTool: ExternalTool = externalToolFactory.build({
					restrictToContexts: [ToolContextType.BOARD_ELEMENT],
				});
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					contextRef: { type: ToolContextType.COURSE },
				});

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);

				return {
					userId,
					context,
					contextExternalTool,
				};
			};

			it('should throw ForbiddenLoggableException', async () => {
				const { userId, context, contextExternalTool } = setup();

				const func = async () => service.checkContextRestrictions(contextExternalTool, userId, context);

				await expect(func()).rejects.toThrow(new ForbiddenLoggableException(userId, 'ContextExternalTool', context));
			});
		});
	});
});
