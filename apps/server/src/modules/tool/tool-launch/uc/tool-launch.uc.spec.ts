import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { contextExternalToolFactory } from '@shared/testing';
import { ToolLaunchService } from '../service';
import { ToolLaunchData, ToolLaunchDataType, ToolLaunchRequest } from '../types';
import { ToolLaunchUc } from './tool-launch.uc';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ToolPermissionHelper } from '../../context-external-tool/uc/tool-permission-helper';

describe('ToolLaunchUc', () => {
	let module: TestingModule;
	let uc: ToolLaunchUc;

	let toolLaunchService: DeepMocked<ToolLaunchService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let toolPermissionHelper: DeepMocked<ToolPermissionHelper>;

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
			],
		}).compile();

		uc = module.get<ToolLaunchUc>(ToolLaunchUc);
		toolLaunchService = module.get(ToolLaunchService);
		toolPermissionHelper = module.get(ToolPermissionHelper);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getToolLaunchRequest', () => {
		const setup = () => {
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

			const userId = 'userId';

			return {
				userId,
				contextExternalToolId,
				contextExternalTool,
				toolLaunchData,
			};
		};

		it('should call service to get context external tool', async () => {
			const { userId, contextExternalToolId } = setup();

			await uc.getToolLaunchRequest(userId, contextExternalToolId);

			expect(contextExternalToolService.getContextExternalToolById).toHaveBeenCalledWith(contextExternalToolId);
		});

		it('should call service to get data', async () => {
			const { userId, contextExternalToolId, contextExternalTool } = setup();
			toolPermissionHelper.ensureContextPermissions.mockResolvedValue();
			contextExternalToolService.getContextExternalToolById.mockResolvedValue(contextExternalTool);

			await uc.getToolLaunchRequest(userId, contextExternalToolId);

			expect(toolLaunchService.getLaunchData).toHaveBeenCalledWith(userId, contextExternalTool);
		});

		it('should call service to generate launch request', async () => {
			const { userId, contextExternalToolId, contextExternalTool, toolLaunchData } = setup();
			toolPermissionHelper.ensureContextPermissions.mockResolvedValue();
			contextExternalToolService.getContextExternalToolById.mockResolvedValue(contextExternalTool);

			toolLaunchService.getLaunchData.mockResolvedValue(toolLaunchData);

			await uc.getToolLaunchRequest(userId, contextExternalToolId);

			expect(toolLaunchService.generateLaunchRequest).toHaveBeenCalledWith(toolLaunchData);
		});

		it('should return launch request', async () => {
			const { userId, contextExternalToolId, toolLaunchData, contextExternalTool } = setup();
			toolPermissionHelper.ensureContextPermissions.mockResolvedValue();
			contextExternalToolService.getContextExternalToolById.mockResolvedValue(contextExternalTool);
			toolLaunchService.getLaunchData.mockResolvedValue(toolLaunchData);

			const toolLaunchRequest: ToolLaunchRequest = await uc.getToolLaunchRequest(userId, contextExternalToolId);

			expect(toolLaunchRequest).toBeDefined();
		});
	});
});
