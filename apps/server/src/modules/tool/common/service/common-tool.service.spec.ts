import { Test, TestingModule } from '@nestjs/testing';
import { contextExternalToolFactory, externalToolFactory, schoolExternalToolFactory } from '@shared/testing';
import { CommonToolService } from './common-tool.service';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ToolConfigurationStatus } from '../enum';
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

			it('should return is latest', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(result).toStrictEqual(
					new ToolConfigurationStatus({
						latest: true,
						isUnkown: false,
						isDisabled: false,
						isOutdatedOnScopeContext: false,
						isOutdatedOnScopeSchool: false,
					})
				);
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

			it('should return isOutdatedOnScopeContext and isOutdatedOnScopeSchool true', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(result).toStrictEqual(
					new ToolConfigurationStatus({
						latest: false,
						isUnkown: false,
						isDisabled: false,
						isOutdatedOnScopeContext: true,
						isOutdatedOnScopeSchool: true,
					})
				);
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

			it('should return isOutdatedOnScopeContext true', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(result).toStrictEqual(
					new ToolConfigurationStatus({
						latest: false,
						isUnkown: false,
						isDisabled: false,
						isOutdatedOnScopeContext: true,
						isOutdatedOnScopeSchool: true,
					})
				);
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

			it('should return isOutdatedOnScopeContext true', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(result).toStrictEqual(
					new ToolConfigurationStatus({
						latest: false,
						isUnkown: false,
						isDisabled: false,
						isOutdatedOnScopeContext: true,
						isOutdatedOnScopeSchool: true,
					})
				);
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

			it('should return is latest', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(result).toStrictEqual(
					new ToolConfigurationStatus({
						latest: true,
						isUnkown: false,
						isDisabled: false,
						isOutdatedOnScopeContext: false,
						isOutdatedOnScopeSchool: false,
					})
				);
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

			it('should return is latest', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(result).toStrictEqual(
					new ToolConfigurationStatus({
						latest: true,
						isUnkown: false,
						isDisabled: false,
						isOutdatedOnScopeContext: false,
						isOutdatedOnScopeSchool: false,
					})
				);
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

			it('should return is latest', () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const result: ToolConfigurationStatus = service.determineToolConfigurationStatus(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);

				expect(result).toStrictEqual(
					new ToolConfigurationStatus({
						latest: true,
						isUnkown: false,
						isDisabled: false,
						isOutdatedOnScopeContext: false,
						isOutdatedOnScopeSchool: false,
					})
				);
			});
		});
	});
});
