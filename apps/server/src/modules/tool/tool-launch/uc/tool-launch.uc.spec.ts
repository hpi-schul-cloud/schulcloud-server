import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { contextExternalToolFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
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
			],
		}).compile();

		uc = module.get<ToolLaunchUc>(ToolLaunchUc);
		toolLaunchService = module.get(ToolLaunchService);
		contextExternalToolService = module.get(ContextExternalToolService);
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

			const userId: string = new ObjectId().toHexString();

			toolPermissionHelper.ensureContextPermissions.mockResolvedValueOnce();
			contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(contextExternalTool);
			toolLaunchService.getLaunchData.mockResolvedValueOnce(toolLaunchData);

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

			expect(contextExternalToolService.findByIdOrFail).toHaveBeenCalledWith(contextExternalToolId);
		});

		it('should call service to get data', async () => {
			const { userId, contextExternalToolId, contextExternalTool } = setup();

			await uc.getToolLaunchRequest(userId, contextExternalToolId);

			expect(toolLaunchService.getLaunchData).toHaveBeenCalledWith(userId, contextExternalTool);
		});

		it('should call service to generate launch request', async () => {
			const { userId, contextExternalToolId, toolLaunchData } = setup();

			toolLaunchService.getLaunchData.mockResolvedValueOnce(toolLaunchData);

			await uc.getToolLaunchRequest(userId, contextExternalToolId);

			expect(toolLaunchService.generateLaunchRequest).toHaveBeenCalledWith(toolLaunchData);
		});

		it('should return launch request', async () => {
			const { userId, contextExternalToolId } = setup();

			const toolLaunchRequest: ToolLaunchRequest = await uc.getToolLaunchRequest(userId, contextExternalToolId);

			expect(toolLaunchRequest).toBeDefined();
		});
	});
});
