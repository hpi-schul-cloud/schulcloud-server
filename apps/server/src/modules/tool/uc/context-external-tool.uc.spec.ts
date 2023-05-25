import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { contextExternalToolDOFactory, setupEntities } from '@shared/testing';
import { ContextExternalToolDO, EntityId, Permission } from '@shared/domain';
import { Action, AuthorizableReferenceType, AuthorizationService } from '@src/modules';
import { ContextExternalToolService, ContextExternalToolValidationService } from '../service';
import { ContextExternalToolUc } from './context-external-tool.uc';
import { ToolContextType } from '../interface';

describe('ContextExternalToolUc', () => {
	let module: TestingModule;
	let uc: ContextExternalToolUc;

	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let contextExternalToolValidationService: DeepMocked<ContextExternalToolValidationService>;
	let authorizationService: DeepMocked<AuthorizationService>;

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
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: ContextExternalToolValidationService,
					useValue: createMock<ContextExternalToolValidationService>(),
				},
			],
		}).compile();

		uc = module.get(ContextExternalToolUc);
		contextExternalToolService = module.get(ContextExternalToolService);
		authorizationService = module.get(AuthorizationService);
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
					contextType: ToolContextType.COURSE,
					contextToolName: 'Course',
					contextId: 'contextId',
				});

				const context = {
					action: Action.write,
					requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
				};

				authorizationService.checkPermissionByReferences.mockResolvedValue(Promise.resolve());
				contextExternalToolValidationService.validate.mockResolvedValue(Promise.resolve());

				return {
					contextExternalTool,
					userId,
					context,
				};
			};

			it('should call contextExternalToolService', async () => {
				const { contextExternalTool, userId } = setup();

				await uc.createContextExternalTool(userId, contextExternalTool);

				expect(contextExternalToolService.createContextExternalTool).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should call authorizationService', async () => {
				const { contextExternalTool, userId, context } = setup();

				await uc.createContextExternalTool(userId, contextExternalTool);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					AuthorizableReferenceType.Course,
					contextExternalTool.contextId,
					context
				);
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

				const context = {
					action: Action.write,
					requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
				};

				authorizationService.checkPermissionByReferences.mockResolvedValue();
				contextExternalToolService.getContextExternalToolById.mockResolvedValue(contextExternalTool);

				return {
					contextExternalTool,
					contextExternalToolId: contextExternalTool.id as EntityId,
					userId,
					context,
				};
			};

			it('should call contextExternalToolService', async () => {
				const { contextExternalTool, contextExternalToolId, userId } = setup();

				await uc.deleteContextExternalTool(userId, contextExternalToolId);

				expect(contextExternalToolService.deleteContextExternalTool).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should call authorizationService', async () => {
				const { contextExternalTool, contextExternalToolId, userId, context } = setup();

				await uc.deleteContextExternalTool(userId, contextExternalToolId);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					AuthorizableReferenceType.Course,
					contextExternalTool.contextId,
					context
				);
			});
		});
	});

	describe('getContextExternalToolsForContext is called', () => {
		describe('when parameters are given and user has permission ', () => {
			it('should call contextExternalToolService', async () => {
				const contextId: EntityId = 'contextId';
				const contextType: ToolContextType = ToolContextType.COURSE;

				await uc.getContextExternalToolsForContext('userId', contextType, contextId);

				expect(contextExternalToolService.getContextExternalToolsForContext).toHaveBeenCalledWith(
					contextType,
					contextId
				);
			});
		});
	});
});
