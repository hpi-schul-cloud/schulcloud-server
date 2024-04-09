import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { contextExternalToolFactory, setupEntities, userFactory } from '@shared/testing';
import { AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { ToolLaunchService } from '../service';
import { ToolLaunchData, ToolLaunchDataType, ToolLaunchRequest } from '../types';
import { ToolLaunchUc } from './tool-launch.uc';

describe('ToolLaunchUc', () => {
	let module: TestingModule;
	let uc: ToolLaunchUc;

	let toolLaunchService: DeepMocked<ToolLaunchService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let toolPermissionHelper: DeepMocked<ToolPermissionHelper>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolLaunchUc,
				{
					provide: ToolLaunchService,
					useValue: createMock<ToolLaunchService>(),
				},
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
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

		uc = module.get<ToolLaunchUc>(ToolLaunchUc);
		toolLaunchService = module.get(ToolLaunchService);
		contextExternalToolService = module.get(ContextExternalToolService);
		toolPermissionHelper = module.get(ToolPermissionHelper);
		authorizationService = module.get(AuthorizationService);
	});

	beforeAll(async () => {
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getToolLaunchRequest', () => {
		const setup = () => {
			const user: User = userFactory.build();
			const contextExternalToolId = 'contextExternalToolId';
			const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
				id: contextExternalToolId,
			});
			const toolLaunchData: ToolLaunchData = new ToolLaunchData({
				baseUrl: 'baseUrl',
				type: ToolLaunchDataType.BASIC,
				openNewTab: true,
				properties: [],
			});

			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
			toolPermissionHelper.ensureContextPermissions.mockResolvedValueOnce();
			contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(contextExternalTool);
			toolLaunchService.getLaunchData.mockResolvedValueOnce(toolLaunchData);

			return {
				user,
				contextExternalToolId,
				contextExternalTool,
				toolLaunchData,
			};
		};

		it('should check user permissions to launch the tool', async () => {
			const { user, contextExternalToolId, contextExternalTool } = setup();

			await uc.getToolLaunchRequest(user.id, contextExternalToolId);

			expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
				user,
				contextExternalTool,
				AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER])
			);
		});

		it('should call service to get context external tool', async () => {
			const { user, contextExternalToolId } = setup();

			await uc.getToolLaunchRequest(user.id, contextExternalToolId);

			expect(contextExternalToolService.findByIdOrFail).toHaveBeenCalledWith(contextExternalToolId);
		});

		it('should call service to get data', async () => {
			const { user, contextExternalToolId, contextExternalTool } = setup();

			await uc.getToolLaunchRequest(user.id, contextExternalToolId);

			expect(toolLaunchService.getLaunchData).toHaveBeenCalledWith(user.id, contextExternalTool);
		});

		it('should call service to generate launch request', async () => {
			const { user, contextExternalToolId, toolLaunchData } = setup();

			toolLaunchService.getLaunchData.mockResolvedValueOnce(toolLaunchData);

			await uc.getToolLaunchRequest(user.id, contextExternalToolId);

			expect(toolLaunchService.generateLaunchRequest).toHaveBeenCalledWith(toolLaunchData);
		});

		it('should return launch request', async () => {
			const { user, contextExternalToolId } = setup();

			const toolLaunchRequest: ToolLaunchRequest = await uc.getToolLaunchRequest(user.id, contextExternalToolId);

			expect(toolLaunchRequest).toBeDefined();
		});
	});
});
