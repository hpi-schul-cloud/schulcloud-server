import { Test, TestingModule } from '@nestjs/testing';
import { externalToolFactory } from '@shared/testing/factory';
import { ExternalTool } from '../../external-tool/domain';
import { ToolContextType } from '../enum';
import { CommonToolService } from './common-tool.service';

describe('CommonToolService', () => {
	let module: TestingModule;
	let service: CommonToolService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [CommonToolService],
		}).compile();

		service = module.get(CommonToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('isContextRestricted', () => {
		describe('when tool is not restricted to context', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build({ restrictToContexts: [] });
				const context: ToolContextType = ToolContextType.COURSE;

				return { externalTool, context };
			};

			it('should return false', () => {
				const { externalTool, context } = setup();

				const result = service.isContextRestricted(externalTool, context);

				expect(result).toBe(false);
			});
		});

		describe('when tool is restricted to all contexts', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build({
					restrictToContexts: [ToolContextType.COURSE, ToolContextType.BOARD_ELEMENT],
				});
				const context: ToolContextType = ToolContextType.COURSE;

				return { externalTool, context };
			};

			it('should return false', () => {
				const { externalTool, context } = setup();

				const result = service.isContextRestricted(externalTool, context);

				expect(result).toBe(false);
			});
		});

		describe('when tool is restricted to correct context', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build({ restrictToContexts: [ToolContextType.COURSE] });
				const context: ToolContextType = ToolContextType.COURSE;

				return { externalTool, context };
			};

			it('should return false', () => {
				const { externalTool, context } = setup();

				const result = service.isContextRestricted(externalTool, context);

				expect(result).toBe(false);
			});
		});

		describe('when tool is restricted to wrong context', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build({
					restrictToContexts: [ToolContextType.BOARD_ELEMENT],
				});
				const context: ToolContextType = ToolContextType.COURSE;

				return { externalTool, context };
			};

			it('should return true', () => {
				const { externalTool, context } = setup();

				const result = service.isContextRestricted(externalTool, context);

				expect(result).toBe(true);
			});
		});
	});
});
