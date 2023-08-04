import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked } from '@golevelup/ts-jest';
import { contextExternalToolFactory, setupEntities } from '@shared/testing';
import { Permission } from '@shared/domain';
import { Action, AuthorizableReferenceType, AuthorizationService } from '@src/modules';
import { ContextExternalToolUc } from '../../context-external-tool/uc';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ToolContextType } from '../enum';
import { ToolPermissionHelper } from './tool-permission-helper';

describe('toolPermissionHelper', () => {
	let module: TestingModule;
	let uc: ToolPermissionHelper;

	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [ToolPermissionHelper],
		}).compile();

		uc = module.get(ContextExternalToolUc);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('ensureContextPermissions is called', () => {
		describe('when context external tool has an id, but no ContextType', () => {
			const setup = () => {
				const userId = 'userId';
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();

				return {
					userId,
					contextExternalTool,
				};
			};

			it('should check permission by reference for context external tool itself', async () => {
				const { userId, contextExternalTool } = setup();

				await uc.ensureContextPermissions(userId, contextExternalTool, {
					requiredPermissions: [Permission.CONTEXT_TOOL_USER],
					action: Action.read,
				});

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					AuthorizableReferenceType.ContextExternalToolEntity,
					contextExternalTool.id,
					{
						action: Action.read,
						requiredPermissions: [Permission.CONTEXT_TOOL_USER],
					}
				);
			});
		});

		describe('when context external tool has an id and a ContextType', () => {
			const setup = () => {
				const userId = 'userId';
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();
				contextExternalTool.contextRef.type = ToolContextType.COURSE;

				return {
					userId,
					contextExternalTool,
				};
			};

			it('should check permission by reference for the dependent context of the context external tool', async () => {
				const { userId, contextExternalTool } = setup();

				await uc.ensureContextPermissions(userId, contextExternalTool, {
					requiredPermissions: [Permission.CONTEXT_TOOL_USER],
					action: Action.read,
				});

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					AuthorizableReferenceType.Course,
					contextExternalTool.contextRef.id,
					{
						action: Action.read,
						requiredPermissions: [Permission.CONTEXT_TOOL_USER],
					}
				);
			});
		});

		describe('context external tool has no id yet', () => {
			const setup = () => {
				const userId = 'userId';
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();
				contextExternalTool.contextRef.type = ToolContextType.COURSE;
				const contextExternalToolWithoutId = new ContextExternalTool({ ...contextExternalTool, id: '' });

				return {
					userId,
					contextExternalToolWithoutId,
				};
			};

			it('should skip permission check for context external tool', async () => {
				const { userId, contextExternalToolWithoutId } = setup();

				await uc.ensureContextPermissions(userId, contextExternalToolWithoutId, {
					requiredPermissions: [Permission.CONTEXT_TOOL_USER],
					action: Action.read,
				});

				expect(authorizationService.checkPermissionByReferences).not.toHaveBeenCalledWith(
					userId,
					AuthorizableReferenceType.ContextExternalToolEntity,
					contextExternalToolWithoutId.id,
					{
						action: Action.read,
						requiredPermissions: [Permission.CONTEXT_TOOL_USER],
					}
				);
			});
		});
	});
});
