import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolService } from '../service';
import { contextExternalToolFactory } from '../testing';
import { AdminApiContextExternalToolUc } from './admin-api-context-external-tool.uc';

describe(AdminApiContextExternalToolUc.name, () => {
	let module: TestingModule;
	let uc: AdminApiContextExternalToolUc;

	let contextExternalToolService: DeepMocked<ContextExternalToolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AdminApiContextExternalToolUc,
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
			],
		}).compile();

		uc = module.get(AdminApiContextExternalToolUc);
		contextExternalToolService = module.get(ContextExternalToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('createExternalTool', () => {
		describe('when creating a tool', () => {
			const setup = () => {
				const contextExternalTool = contextExternalToolFactory.build();

				contextExternalToolService.saveContextExternalTool.mockResolvedValueOnce(contextExternalTool);

				return {
					contextExternalTool,
				};
			};

			it('should save the tool', async () => {
				const { contextExternalTool } = setup();

				await uc.createContextExternalTool(contextExternalTool.getProps());

				expect(contextExternalToolService.saveContextExternalTool).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should return the tool', async () => {
				const { contextExternalTool } = setup();

				const result = await uc.createContextExternalTool(contextExternalTool.getProps());

				expect(result).toEqual(contextExternalTool);
			});
		});
	});
});
