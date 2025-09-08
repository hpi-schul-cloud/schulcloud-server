import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalTool } from '../domain';
import { ExternalToolService } from '../service';
import { externalToolFactory } from '../testing';
import { AdminApiExternalToolUc } from './admin-api-external-tool.uc';

describe(AdminApiExternalToolUc.name, () => {
	let module: TestingModule;
	let uc: AdminApiExternalToolUc;

	let externalToolService: DeepMocked<ExternalToolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AdminApiExternalToolUc,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
			],
		}).compile();

		uc = module.get(AdminApiExternalToolUc);
		externalToolService = module.get(ExternalToolService);
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
				const externalTool = externalToolFactory.build();

				externalToolService.createExternalTool.mockResolvedValueOnce(externalTool);

				return {
					externalTool,
				};
			};

			it('should save the tool', async () => {
				const { externalTool } = setup();

				await uc.createExternalTool(externalTool.getProps());

				expect(externalToolService.createExternalTool).toHaveBeenCalledWith(
					new ExternalTool({
						...externalTool.getProps(),
						id: expect.any(String),
						logoUrl: undefined,
						thumbnail: undefined,
					})
				);
			});

			it('should return the tool', async () => {
				const { externalTool } = setup();

				const result = await uc.createExternalTool(externalTool.getProps());

				expect(result).toEqual(externalTool);
			});
		});
	});
});
