import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolDO } from '@shared/domain';
import { contextExternalToolDOFactory } from '@shared/testing';
import { ToolLaunchService } from '../service';
import { ToolLaunchData, ToolLaunchDataType, ToolLaunchRequest } from '../types';
import { ToolLaunchUc } from './tool-launch.uc';
import { ContextExternalToolService } from '../../context-external-tool/service';

describe('ToolLaunchUc', () => {
	let module: TestingModule;
	let uc: ToolLaunchUc;

	let toolLaunchService: DeepMocked<ToolLaunchService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;

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
		contextExternalToolService = module.get(ContextExternalToolService);
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
			const contextExternalToolDO: ContextExternalToolDO = contextExternalToolDOFactory.build({
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
				contextExternalToolDO,
				toolLaunchData,
			};
		};

		it('should call service to get context external tool', async () => {
			const { userId, contextExternalToolId } = setup();

			await uc.getToolLaunchRequest(userId, contextExternalToolId);

			expect(contextExternalToolService.getContextExternalToolById).toHaveBeenCalledWith(contextExternalToolId);
		});

		it('should call service to get data', async () => {
			const { userId, contextExternalToolId, contextExternalToolDO } = setup();
			contextExternalToolService.ensureContextPermissions.mockResolvedValue();
			contextExternalToolService.getContextExternalToolById.mockResolvedValue(contextExternalToolDO);

			await uc.getToolLaunchRequest(userId, contextExternalToolId);

			expect(toolLaunchService.getLaunchData).toHaveBeenCalledWith(userId, contextExternalToolDO);
		});

		it('should call service to generate launch request', async () => {
			const { userId, contextExternalToolId, contextExternalToolDO, toolLaunchData } = setup();
			contextExternalToolService.ensureContextPermissions.mockResolvedValue();
			contextExternalToolService.getContextExternalToolById.mockResolvedValue(contextExternalToolDO);

			toolLaunchService.getLaunchData.mockResolvedValue(toolLaunchData);

			await uc.getToolLaunchRequest(userId, contextExternalToolId);

			expect(toolLaunchService.generateLaunchRequest).toHaveBeenCalledWith(toolLaunchData);
		});

		it('should return launch request', async () => {
			const { userId, contextExternalToolId, toolLaunchData, contextExternalToolDO } = setup();
			contextExternalToolService.ensureContextPermissions.mockResolvedValue();
			contextExternalToolService.getContextExternalToolById.mockResolvedValue(contextExternalToolDO);
			toolLaunchService.getLaunchData.mockResolvedValue(toolLaunchData);

			const toolLaunchRequest: ToolLaunchRequest = await uc.getToolLaunchRequest(userId, contextExternalToolId);

			expect(toolLaunchRequest).toBeDefined();
		});
	});
});
