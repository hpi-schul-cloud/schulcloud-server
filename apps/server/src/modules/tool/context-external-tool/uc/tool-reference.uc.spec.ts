import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { contextExternalToolFactory, externalToolFactory, toolConfigurationStatusFactory } from '@shared/testing';
import { ToolContextType } from '../../common/enum';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { ExternalTool } from '../../external-tool/domain';
import { ContextExternalTool, ToolReference } from '../domain';
import { ContextExternalToolService, ToolReferenceService } from '../service';
import { ToolReferenceUc } from './tool-reference.uc';

describe('ToolReferenceUc', () => {
	let module: TestingModule;
	let uc: ToolReferenceUc;

	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let toolReferenceService: DeepMocked<ToolReferenceService>;
	let toolPermissionHelper: DeepMocked<ToolPermissionHelper>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolReferenceUc,
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
				{
					provide: ToolReferenceService,
					useValue: createMock<ToolReferenceService>(),
				},
				{
					provide: ToolPermissionHelper,
					useValue: createMock<ToolPermissionHelper>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		uc = module.get(ToolReferenceUc);

		contextExternalToolService = module.get(ContextExternalToolService);
		toolReferenceService = module.get(ToolReferenceService);
		toolPermissionHelper = module.get(ToolPermissionHelper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getToolReferencesForContext', () => {
		describe('when called with a context type and id', () => {
			const setup = () => {
				const userId = 'userId';

				const externalTool: ExternalTool = externalToolFactory.withBase64Logo().buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();
				const toolReference: ToolReference = new ToolReference({
					logoUrl: externalTool.logoUrl,
					contextToolId: contextExternalTool.id as string,
					displayName: contextExternalTool.displayName as string,
					status: toolConfigurationStatusFactory.build({
						isOutdatedOnScopeSchool: false,
						isOutdatedOnScopeContext: false,
					}),
					openInNewTab: externalTool.openNewTab,
				});

				const contextType: ToolContextType = ToolContextType.COURSE;
				const contextId = 'contextId';

				contextExternalToolService.findAllByContext.mockResolvedValueOnce([contextExternalTool]);
				toolPermissionHelper.ensureContextPermissions.mockResolvedValueOnce();
				toolReferenceService.getToolReference.mockResolvedValue(toolReference);

				return {
					userId,
					contextType,
					contextId,
					contextExternalTool,
					externalTool,
					toolReference,
				};
			};

			it('should call toolPermissionHelper.ensureContextPermissions', async () => {
				const { userId, contextType, contextId, contextExternalTool } = setup();

				await uc.getToolReferencesForContext(userId, contextType, contextId);

				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					userId,
					contextExternalTool,
					AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER])
				);
			});

			it('should return a list of tool references', async () => {
				const { userId, contextType, contextId, toolReference } = setup();

				const result: ToolReference[] = await uc.getToolReferencesForContext(userId, contextType, contextId);

				expect(result).toEqual<ToolReference[]>([toolReference]);
			});
		});

		describe('when user does not have permission to a tool', () => {
			const setup = () => {
				const userId = 'userId';

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();

				const contextType: ToolContextType = ToolContextType.COURSE;
				const contextId = 'contextId';

				contextExternalToolService.findAllByContext.mockResolvedValueOnce([contextExternalTool]);
				toolPermissionHelper.ensureContextPermissions.mockRejectedValueOnce(new ForbiddenException());

				return {
					userId,
					contextType,
					contextId,
				};
			};

			it('should filter out tool references if a ForbiddenException is thrown', async () => {
				const { userId, contextType, contextId } = setup();

				const result: ToolReference[] = await uc.getToolReferencesForContext(userId, contextType, contextId);

				expect(result).toEqual<ToolReference[]>([]);
			});
		});
	});

	describe('getToolReference', () => {
		describe('when called with a context type and id', () => {
			const setup = () => {
				const userId = 'userId';
				const contextExternalToolId = 'contextExternalToolId';

				const externalTool: ExternalTool = externalToolFactory.withBase64Logo().buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId(
					undefined,
					contextExternalToolId
				);
				const toolReference: ToolReference = new ToolReference({
					logoUrl: externalTool.logoUrl,
					contextToolId: contextExternalTool.id as string,
					displayName: contextExternalTool.displayName as string,
					status: toolConfigurationStatusFactory.build({
						isOutdatedOnScopeSchool: false,
						isOutdatedOnScopeContext: false,
					}),
					openInNewTab: externalTool.openNewTab,
				});

				contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(contextExternalTool);
				toolPermissionHelper.ensureContextPermissions.mockResolvedValueOnce();
				toolReferenceService.getToolReference.mockResolvedValue(toolReference);

				return {
					userId,
					contextExternalTool,
					externalTool,
					toolReference,
					contextExternalToolId,
				};
			};

			it('should call toolPermissionHelper.ensureContextPermissions', async () => {
				const { userId, contextExternalToolId, contextExternalTool } = setup();

				await uc.getToolReference(userId, contextExternalToolId);

				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					userId,
					contextExternalTool,
					AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER])
				);
			});

			it('should return a list of tool references', async () => {
				const { userId, contextExternalToolId, toolReference } = setup();

				const result: ToolReference = await uc.getToolReference(userId, contextExternalToolId);

				expect(result).toEqual(toolReference);
			});
		});

		describe('when user does not have permission to a tool', () => {
			const setup = () => {
				const userId = 'userId';
				const contextExternalToolId = 'contextExternalToolId';

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId(
					undefined,
					contextExternalToolId
				);
				const error = new ForbiddenException();

				contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(contextExternalTool);
				toolPermissionHelper.ensureContextPermissions.mockRejectedValueOnce(error);

				return {
					userId,
					contextExternalToolId,
					error,
				};
			};

			it('should filter out tool references if a ForbiddenException is thrown', async () => {
				const { userId, contextExternalToolId, error } = setup();

				await expect(uc.getToolReference(userId, contextExternalToolId)).rejects.toThrow(error);
			});
		});
	});
});
