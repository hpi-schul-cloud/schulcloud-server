import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalTool } from '../../../context-external-tool/domain';
import { contextExternalToolFactory } from '../../../context-external-tool/testing';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { schoolExternalToolFactory } from '../../../school-external-tool/testing';
import { AutoContextIdStrategy } from './auto-context-id.strategy';

describe(AutoContextIdStrategy.name, () => {
	let module: TestingModule;
	let strategy: AutoContextIdStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [AutoContextIdStrategy],
		}).compile();

		strategy = module.get(AutoContextIdStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getValue', () => {
		const setup = () => {
			const contextId = 'contextId';

			const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
			const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
				schoolToolRef: {
					schoolToolId: schoolExternalTool.id,
				},
				contextRef: {
					id: contextId,
				},
			});

			return {
				contextId,
				schoolExternalTool,
				contextExternalTool,
			};
		};

		it('should return the context id', () => {
			const { contextId, schoolExternalTool, contextExternalTool } = setup();

			const result: string | undefined = strategy.getValue(schoolExternalTool, contextExternalTool);

			expect(result).toEqual(contextId);
		});
	});
});
