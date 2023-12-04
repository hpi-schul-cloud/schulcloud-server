import { Test, TestingModule } from '@nestjs/testing';
import { contextExternalToolFactory, externalToolFactory, schoolExternalToolFactory } from '@shared/testing';
import { CommonToolService } from './common-tool.service';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ToolConfigurationStatus, ToolContextType } from '../enum';
import { ContextExternalTool } from '../../context-external-tool/domain';

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

	describe('determineToolConfigurationStatus', () => {
		describe('when all versions are equal', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ version: 0 });
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({ toolVersion: 0 });
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({ toolVersion: 0 });

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return ToolConfigurationStatus.LATEST', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(result).toBe(ToolConfigurationStatus.LATEST);
			});
		});

		describe('when externalTool version is greater than schoolExternalTool version', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ version: 1 });
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({ toolVersion: 0 });
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({ toolVersion: 0 });

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return ToolConfigurationStatus.OUTDATED', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(result).toBe(ToolConfigurationStatus.OUTDATED);
			});
		});

		describe('when schoolExternalTool version is greater than contextExternalTool version', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ version: 1 });
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({ toolVersion: 1 });
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({ toolVersion: 0 });

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return ToolConfigurationStatus.OUTDATED', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(result).toBe(ToolConfigurationStatus.OUTDATED);
			});
		});

		describe('when externalTool version is greater than contextExternalTool version', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ version: 1 });
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({ toolVersion: 1 });
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({ toolVersion: 0 });

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return ToolConfigurationStatus.OUTDATED', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(result).toBe(ToolConfigurationStatus.OUTDATED);
			});
		});

		describe('when contextExternalTool version is greater than schoolExternalTool version', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ version: 1 });
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({ toolVersion: 1 });
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({ toolVersion: 2 });

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return ToolConfigurationStatus.LATEST', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(result).toBe(ToolConfigurationStatus.LATEST);
			});
		});

		describe('when contextExternalTool version is greater than externalTool version', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ version: 1 });
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({ toolVersion: 1 });
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({ toolVersion: 2 });

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return ToolConfigurationStatus.LATEST', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(result).toBe(ToolConfigurationStatus.LATEST);
			});
		});

		describe('when schoolExternalTool version is greater than externalTool version', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ version: 1 });
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({ toolVersion: 2 });
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({ toolVersion: 2 });

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return ToolConfigurationStatus.LATEST', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(result).toBe(ToolConfigurationStatus.LATEST);
			});
		});
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
