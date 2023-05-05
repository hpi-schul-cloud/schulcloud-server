import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ContextExternalToolService, ContextExternalToolValidationService } from '@src/modules/tool/service';
import { contextExternalToolDOFactory, setupEntities } from '@shared/testing';
import { ContextExternalToolUc } from '@src/modules/tool/uc/context-external-tool.uc';
import { Actions, ContextExternalToolDO, EntityId, Permission } from '@shared/domain';
import { AllowedAuthorizationEntityType, AuthorizationService } from '@src/modules';
import { ToolContextType } from '@src/modules/tool/interface';

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
		const setup = () => {
			const userId: EntityId = 'userId';

			const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.buildWithId({
				contextType: ToolContextType.COURSE,
				contextToolName: 'Course',
				contextId: 'contextId',
			});

			const context = {
				action: Actions.write,
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

		describe('when contextExternalTool is given and user has permission ', () => {
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
					AllowedAuthorizationEntityType.Course,
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
});
