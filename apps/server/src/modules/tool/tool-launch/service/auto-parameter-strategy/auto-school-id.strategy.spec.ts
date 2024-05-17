import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalTool } from '../../../context-external-tool/domain';
import { contextExternalToolFactory } from '../../../context-external-tool/testing';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { schoolExternalToolFactory } from '../../../school-external-tool/testing';
import { AutoSchoolIdStrategy } from './auto-school-id.strategy';

describe(AutoSchoolIdStrategy.name, () => {
	let module: TestingModule;
	let strategy: AutoSchoolIdStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [AutoSchoolIdStrategy],
		}).compile();

		strategy = module.get(AutoSchoolIdStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getValue', () => {
		const setup = () => {
			const schoolId = 'schoolId';

			const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
				schoolId,
			});
			const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
				schoolToolRef: {
					schoolToolId: schoolExternalTool.id,
					schoolId,
				},
			});

			return {
				schoolId,
				schoolExternalTool,
				contextExternalTool,
			};
		};

		it('should return the context id', () => {
			const { schoolId, schoolExternalTool, contextExternalTool } = setup();

			const result: string | undefined = strategy.getValue(schoolExternalTool, contextExternalTool);

			expect(result).toEqual(schoolId);
		});
	});
});
