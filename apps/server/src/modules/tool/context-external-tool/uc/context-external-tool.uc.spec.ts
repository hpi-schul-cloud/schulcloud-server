import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, Permission } from '@shared/domain';
import { contextExternalToolDOFactory, setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { ForbiddenLoggableException } from '@src/modules/authorization/errors/forbidden.loggable-exception';
import { Action } from '@src/modules/authorization';
import { ContextExternalToolUc } from './context-external-tool.uc';
import { ContextExternalToolService, ContextExternalToolValidationService } from '../service';
import { ContextExternalToolDO } from '../domainobject';
import { ToolContextType } from '../../common/enum';

describe('ContextExternalToolUc', () => {
	let module: TestingModule;
	let uc: ContextExternalToolUc;

	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let contextExternalToolValidationService: DeepMocked<ContextExternalToolValidationService>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				ContextExternalToolUc,
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
				{
					provide: ContextExternalToolValidationService,
					useValue: createMock<ContextExternalToolValidationService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		uc = module.get(ContextExternalToolUc);
		contextExternalToolService = module.get(ContextExternalToolService);
		contextExternalToolValidationService = module.get(ContextExternalToolValidationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('createContextExternalTool is called', () => {
		describe('when contextExternalTool is given and user has permission ', () => {
			const setup = () => {
				const userId: EntityId = 'userId';

				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.buildWithId({
					displayName: 'Course',
					contextRef: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				});

				contextExternalToolService.ensureContextPermissions.mockResolvedValue(Promise.resolve());
				contextExternalToolValidationService.validate.mockResolvedValue(Promise.resolve());

				return {
					contextExternalTool,
					userId,
				};
			};

			it('should call contextExternalToolService', async () => {
				const { contextExternalTool, userId } = setup();

				await uc.createContextExternalTool(userId, contextExternalTool);

				expect(contextExternalToolService.createContextExternalTool).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should call contextExternalToolService to ensure permissions', async () => {
				const { contextExternalTool, userId } = setup();

				await uc.createContextExternalTool(userId, contextExternalTool);

				expect(contextExternalToolService.ensureContextPermissions).toHaveBeenCalledWith(userId, contextExternalTool, {
					requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
					action: Action.write,
				});
			});

			it('should call contextExternalToolValidationService', async () => {
				const { contextExternalTool, userId } = setup();

				await uc.createContextExternalTool(userId, contextExternalTool);

				expect(contextExternalToolValidationService.validate).toHaveBeenCalledWith(contextExternalTool);
			});
		});
	});

	describe('deleteContextExternalTool is called', () => {
		describe('when contextExternalTool is given and user has permission ', () => {
			const setup = () => {
				const userId: EntityId = 'userId';

				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.buildWithId();

				contextExternalToolService.ensureContextPermissions.mockResolvedValue();
				contextExternalToolService.getContextExternalToolById.mockResolvedValue(contextExternalTool);

				return {
					contextExternalTool,
					contextExternalToolId: contextExternalTool.id as string,
					userId,
				};
			};

			it('should call contextExternalToolService', async () => {
				const { contextExternalTool, contextExternalToolId, userId } = setup();

				await uc.deleteContextExternalTool(userId, contextExternalToolId);

				expect(contextExternalToolService.deleteContextExternalTool).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should call contextExternalToolService to ensure permissions', async () => {
				const { contextExternalTool, contextExternalToolId, userId } = setup();

				await uc.deleteContextExternalTool(userId, contextExternalToolId);

				expect(contextExternalToolService.ensureContextPermissions).toHaveBeenCalledWith(userId, contextExternalTool, {
					requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
					action: Action.write,
				});
			});
		});
	});

	describe('getContextExternalToolsForContext is called', () => {
		describe('when parameters are given and user has permission ', () => {
			const setup = () => {
				const userId: EntityId = 'userId';
				const contextId: EntityId = 'contextId';
				const contextType: ToolContextType = ToolContextType.COURSE;

				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.buildWithId({
					displayName: 'Course',
					contextRef: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				});

				contextExternalToolService.findAllByContext.mockResolvedValue([contextExternalTool]);
				contextExternalToolService.ensureContextPermissions.mockResolvedValue(Promise.resolve());

				return {
					contextExternalTool,
					userId,
					contextId,
					contextType,
				};
			};

			it('should call contextExternalToolService', async () => {
				const { userId, contextType, contextId } = setup();

				await uc.getContextExternalToolsForContext(userId, contextType, contextId);

				expect(contextExternalToolService.findAllByContext).toHaveBeenCalledWith({ id: contextId, type: contextType });
			});

			it('should call contextExternalToolService to ensure permissions', async () => {
				const { userId, contextType, contextId, contextExternalTool } = setup();

				await uc.getContextExternalToolsForContext(userId, contextType, contextId);

				expect(contextExternalToolService.ensureContextPermissions).toHaveBeenCalledWith(userId, contextExternalTool, {
					requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
					action: Action.read,
				});
			});

			it('should handle ForbiddenLoggableException and not include the tool in the response', async () => {
				const { userId, contextType, contextId } = setup();

				contextExternalToolService.ensureContextPermissions.mockRejectedValue(
					new ForbiddenLoggableException(userId, 'contextExternalTool', {
						requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
						action: Action.read,
					})
				);

				const tools = await uc.getContextExternalToolsForContext(userId, contextType, contextId);

				expect(tools).toEqual([]);
			});

			it('should rethrow any exception other than ForbiddenLoggableException', async () => {
				const { userId, contextType, contextId } = setup();

				contextExternalToolService.ensureContextPermissions.mockRejectedValue(new Error());

				await expect(uc.getContextExternalToolsForContext(userId, contextType, contextId)).rejects.toThrow(Error);
			});
		});
	});
});
