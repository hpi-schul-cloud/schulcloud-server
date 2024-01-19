import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common';
import {
	contextExternalToolFactory,
	customParameterFactory,
	externalToolFactory,
	schoolExternalToolFactory,
} from '@shared/testing';
import { CustomParameterEntry } from '../../domain';
import { CustomParameterScope } from '../../enum';
import { CommonToolValidationService } from './common-tool-validation.service';

describe('CommonToolValidationService', () => {
	let service: CommonToolValidationService;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [CommonToolValidationService],
		}).compile();

		service = module.get(CommonToolValidationService);
	});

	describe('validateParameters', () => {
		describe('when validating a valid school external tool', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId({
					parameters: [
						customParameterFactory.build({
							name: 'param1',
							scope: CustomParameterScope.SCHOOL,
						}),
					],
				});
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					parameters: [
						new CustomParameterEntry({
							name: 'param1',
							value: 'test',
						}),
					],
				});

				return {
					externalTool,
					schoolExternalTool,
				};
			};

			it('should return an empty array', () => {
				const { externalTool, schoolExternalTool } = setup();

				const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

				expect(result).toHaveLength(0);
			});
		});

		describe('when validating an invalid school external tool', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId({
					parameters: [
						customParameterFactory.build({
							name: 'param1',
							scope: CustomParameterScope.SCHOOL,
						}),
					],
				});
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					parameters: [
						new CustomParameterEntry({
							name: 'param1',
						}),
					],
				});

				return {
					externalTool,
					schoolExternalTool,
				};
			};

			it('should return a validation error', () => {
				const { externalTool, schoolExternalTool } = setup();

				const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

				expect(result).toHaveLength(1);
			});
		});

		describe('when validating a valid context external tool', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId({
					parameters: [
						customParameterFactory.build({
							name: 'param1',
							scope: CustomParameterScope.CONTEXT,
						}),
					],
				});
				const contextExternalTool = contextExternalToolFactory.buildWithId({
					parameters: [
						new CustomParameterEntry({
							name: 'param1',
							value: 'test',
						}),
					],
				});

				return {
					externalTool,
					contextExternalTool,
				};
			};

			it('should return an empty array', () => {
				const { externalTool, contextExternalTool } = setup();

				const result: ValidationError[] = service.validateParameters(externalTool, contextExternalTool);

				expect(result).toHaveLength(0);
			});
		});

		describe('when validating an invalid context external tool', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId({
					parameters: [
						customParameterFactory.build({
							name: 'param1',
							scope: CustomParameterScope.CONTEXT,
						}),
					],
				});
				const contextExternalTool = contextExternalToolFactory.buildWithId({
					parameters: [
						new CustomParameterEntry({
							name: 'param1',
						}),
					],
				});

				return {
					externalTool,
					contextExternalTool,
				};
			};

			it('should return a validation error', () => {
				const { externalTool, contextExternalTool } = setup();

				const result: ValidationError[] = service.validateParameters(externalTool, contextExternalTool);

				expect(result).toHaveLength(1);
			});
		});
	});
});
