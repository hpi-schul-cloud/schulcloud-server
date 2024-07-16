import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalTool } from '../../../context-external-tool/domain';
import { contextExternalToolFactory } from '../../../context-external-tool/testing';
import { ExternalTool } from '../../../external-tool/domain';
import { ExternalToolService } from '../../../external-tool/service';
import { externalToolFactory } from '../../../external-tool/testing';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { schoolExternalToolFactory } from '../../../school-external-tool/testing';
import { AutoMediumIdStrategy } from './auto-medium-id.strategy';

describe(AutoMediumIdStrategy.name, () => {
	let module: TestingModule;
	let strategy: AutoMediumIdStrategy;

	let externalToolService: DeepMocked<ExternalToolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AutoMediumIdStrategy,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
			],
		}).compile();

		strategy = module.get(AutoMediumIdStrategy);
		externalToolService = module.get(ExternalToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getValue', () => {
		describe('when the external tool has a medium id', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.withMedium().buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({});

				externalToolService.findById.mockResolvedValueOnce(externalTool);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return the medium id', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const result: string | undefined = await strategy.getValue(schoolExternalTool, contextExternalTool);

				expect(result).toEqual(externalTool.medium?.mediumId);
			});
		});

		describe('when the external tool does not have a medium id', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({});

				externalToolService.findById.mockResolvedValueOnce(externalTool);

				return {
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return undefined', async () => {
				const { schoolExternalTool, contextExternalTool } = setup();

				const result: string | undefined = await strategy.getValue(schoolExternalTool, contextExternalTool);

				expect(result).toBeUndefined();
			});
		});
	});
});
