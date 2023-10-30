import { Test, TestingModule } from '@nestjs/testing';
import { contextExternalToolFactory } from '@shared/testing/factory/domainobject/tool/context-external-tool.factory';
import { externalToolFactory } from '@shared/testing/factory/domainobject/tool/external-tool.factory';
import { schoolExternalToolFactory } from '@shared/testing/factory/domainobject/tool/school-external-tool.factory';
import { ContextExternalTool } from '../../context-external-tool/domain/context-external-tool.do';
import { ExternalTool } from '../../external-tool/domain/external-tool.do';
import { SchoolExternalTool } from '../../school-external-tool/domain/school-external-tool.do';
import { ToolConfigurationStatus } from '../enum/tool-configuration-status';
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
});
