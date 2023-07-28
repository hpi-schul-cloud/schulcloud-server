import { Test, TestingModule } from '@nestjs/testing';
import { contextExternalToolDOFactory, externalToolDOFactory, schoolExternalToolDOFactory } from '@shared/testing';
import { CommonToolService } from './common-tool.service';
import { ExternalToolDO } from '../../external-tool/domain';
import { SchoolExternalToolDO } from '../../school-external-tool/domain';
import { ToolConfigurationStatus } from '../enum';
import { ContextExternalToolDO } from '../../context-external-tool/domain';

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
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId({ version: 0 });
				const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId({ toolVersion: 0 });
				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.buildWithId({ toolVersion: 0 });

				return {
					externalToolDO,
					schoolExternalToolDO,
					contextExternalTool,
				};
			};

			it('should return ToolConfigurationStatus.LATEST', () => {
				const { externalToolDO, schoolExternalToolDO, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalToolDO,
					schoolExternalToolDO,
					contextExternalTool
				);

				expect(result).toBe(ToolConfigurationStatus.LATEST);
			});
		});

		describe('when externalTool version is greater than schoolExternalTool version', () => {
			const setup = () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId({ version: 1 });
				const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId({ toolVersion: 0 });
				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.buildWithId({ toolVersion: 0 });

				return {
					externalToolDO,
					schoolExternalToolDO,
					contextExternalTool,
				};
			};

			it('should return ToolConfigurationStatus.OUTDATED', () => {
				const { externalToolDO, schoolExternalToolDO, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalToolDO,
					schoolExternalToolDO,
					contextExternalTool
				);

				expect(result).toBe(ToolConfigurationStatus.OUTDATED);
			});
		});

		describe('when schoolExternalTool version is greater than contextExternalTool version', () => {
			const setup = () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId({ version: 1 });
				const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId({ toolVersion: 1 });
				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.buildWithId({ toolVersion: 0 });

				return {
					externalToolDO,
					schoolExternalToolDO,
					contextExternalTool,
				};
			};

			it('should return ToolConfigurationStatus.OUTDATED', () => {
				const { externalToolDO, schoolExternalToolDO, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalToolDO,
					schoolExternalToolDO,
					contextExternalTool
				);

				expect(result).toBe(ToolConfigurationStatus.OUTDATED);
			});
		});

		describe('when externalTool version is greater than contextExternalTool version', () => {
			const setup = () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId({ version: 1 });
				const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId({ toolVersion: 1 });
				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.buildWithId({ toolVersion: 0 });

				return {
					externalToolDO,
					schoolExternalToolDO,
					contextExternalTool,
				};
			};

			it('should return ToolConfigurationStatus.OUTDATED', () => {
				const { externalToolDO, schoolExternalToolDO, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalToolDO,
					schoolExternalToolDO,
					contextExternalTool
				);

				expect(result).toBe(ToolConfigurationStatus.OUTDATED);
			});
		});

		describe('when contextExternalTool version is greater than schoolExternalTool version', () => {
			const setup = () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId({ version: 1 });
				const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId({ toolVersion: 1 });
				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.buildWithId({ toolVersion: 2 });

				return {
					externalToolDO,
					schoolExternalToolDO,
					contextExternalTool,
				};
			};

			it('should return ToolConfigurationStatus.LATEST', () => {
				const { externalToolDO, schoolExternalToolDO, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalToolDO,
					schoolExternalToolDO,
					contextExternalTool
				);

				expect(result).toBe(ToolConfigurationStatus.LATEST);
			});
		});

		describe('when contextExternalTool version is greater than externalTool version', () => {
			const setup = () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId({ version: 1 });
				const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId({ toolVersion: 1 });
				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.buildWithId({ toolVersion: 2 });

				return {
					externalToolDO,
					schoolExternalToolDO,
					contextExternalTool,
				};
			};

			it('should return ToolConfigurationStatus.LATEST', () => {
				const { externalToolDO, schoolExternalToolDO, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalToolDO,
					schoolExternalToolDO,
					contextExternalTool
				);

				expect(result).toBe(ToolConfigurationStatus.LATEST);
			});
		});

		describe('when schoolExternalTool version is greater than externalTool version', () => {
			const setup = () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId({ version: 1 });
				const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId({ toolVersion: 2 });
				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.buildWithId({ toolVersion: 2 });

				return {
					externalToolDO,
					schoolExternalToolDO,
					contextExternalTool,
				};
			};

			it('should return ToolConfigurationStatus.LATEST', () => {
				const { externalToolDO, schoolExternalToolDO, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalToolDO,
					schoolExternalToolDO,
					contextExternalTool
				);

				expect(result).toBe(ToolConfigurationStatus.LATEST);
			});
		});
	});
});
