import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { contextExternalToolDOFactory, toolLaunchDataFactory } from '@shared/testing';
import { ContextExternalToolDO, ToolLaunchDataDO, ToolLaunchRequestDO } from '@shared/domain';
import { ToolLaunchService } from '../service/tool-launch.service';
import { ContextExternalToolService } from '../../service';
import { ToolLaunchUc } from './tool-launch.uc';

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
			const toolLaunchDataDO: ToolLaunchDataDO = toolLaunchDataFactory.build();

			const userId = 'userId';

			return {
				userId,
				contextExternalToolId,
				contextExternalToolDO,
				toolLaunchDataDO,
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

			expect(toolLaunchService.getLaunchData).toHaveBeenCalledWith(contextExternalToolDO);
		});

		it('should call service to generate launch request', async () => {
			const { userId, contextExternalToolId, contextExternalToolDO, toolLaunchDataDO } = setup();
			contextExternalToolService.ensureContextPermissions.mockResolvedValue();
			contextExternalToolService.getContextExternalToolById.mockResolvedValue(contextExternalToolDO);

			toolLaunchService.getLaunchData.mockResolvedValue(toolLaunchDataDO);

			await uc.getToolLaunchRequest(userId, contextExternalToolId);

			expect(toolLaunchService.generateLaunchRequest).toHaveBeenCalledWith(toolLaunchDataDO);
		});

		it('should return launch request', async () => {
			const { userId, contextExternalToolId, toolLaunchDataDO, contextExternalToolDO } = setup();
			contextExternalToolService.ensureContextPermissions.mockResolvedValue();
			contextExternalToolService.getContextExternalToolById.mockResolvedValue(contextExternalToolDO);
			toolLaunchService.getLaunchData.mockResolvedValue(toolLaunchDataDO);

			const toolLaunchRequest: ToolLaunchRequestDO = await uc.getToolLaunchRequest(userId, contextExternalToolId);

			expect(toolLaunchRequest).toBeDefined();
		});
	});
});
