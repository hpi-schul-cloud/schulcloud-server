import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { contextExternalToolFactory, setupEntities } from '@shared/testing';
import { Permission } from '@shared/domain';
import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { ContextExternalTool } from '../domain';
import { ToolPermissionHelper } from './tool-permission-helper';

describe('ToolPermissionHelper', () => {
	let module: TestingModule;
	let helper: ToolPermissionHelper;

	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				ToolPermissionHelper,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		helper = module.get(ToolPermissionHelper);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('ensureContextPermissions is called', () => {
		describe('when context external tool is given', () => {
			const setup = () => {
				const userId = 'userId';
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

				return {
					userId,
					contextExternalTool,
					context,
				};
			};

			it('should check permission for context external tool', async () => {
				const { userId, contextExternalTool, context } = setup();

				await helper.ensureContextPermissions(userId, contextExternalTool, context);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(userId, contextExternalTool, context);
			});
		});
	});
});
