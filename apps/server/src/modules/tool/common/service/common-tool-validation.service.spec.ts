import { Test, TestingModule } from '@nestjs/testing';
import {
	contextExternalToolFactory,
	customParameterFactory,
	externalToolFactory,
	schoolExternalToolFactory,
} from '@shared/testing';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { CustomParameter } from '../domain';
import { CustomParameterScope, CustomParameterType } from '../enum';
import { CommonToolValidationService } from './common-tool-validation.service';

describe('CommonToolValidationService', () => {
	let service: CommonToolValidationService;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [CommonToolValidationService],
		}).compile();

		service = module.get(CommonToolValidationService);
	});

	describe('checkForDuplicateParameters', () => {
		describe('when given parameters has a case sensitive duplicate', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					parameters: [
						{ name: 'nameDuplicate', value: 'value' },
						{ name: 'nameDuplicate', value: 'value' },
					],
				});

				return {
					schoolExternalTool,
				};
			};

			it('should throw error', () => {
				const { schoolExternalTool } = setup();

				const func = () => service.checkForDuplicateParameters(schoolExternalTool);

				expect(func).toThrow('tool_param_duplicate');
			});
		});

		describe('when given parameters has case insensitive duplicate', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					parameters: [
						{ name: 'nameDuplicate', value: 'value' },
						{ name: 'nameduplicate', value: 'value' },
					],
				});

				return {
					schoolExternalTool,
				};
			};

			it('should throw error when given parameters has case insensitive duplicate', () => {
				const { schoolExternalTool } = setup();

				const func = () => service.checkForDuplicateParameters(schoolExternalTool);

				expect(func).toThrowError('tool_param_duplicate');
			});
		});

		describe('when given parameters has no duplicates', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					parameters: [
						{ name: 'nameNoDuplicate1', value: 'value' },
						{ name: 'nameNoDuplicate2', value: 'value' },
					],
				});

				return {
					schoolExternalTool,
				};
			};

			it('when given parameters has no duplicates should return without error', () => {
				const { schoolExternalTool } = setup();

				const func = () => service.checkForDuplicateParameters(schoolExternalTool);

				expect(func).not.toThrowError('tool_param_duplicate');
			});
		});
	});

	describe('checkCustomParameterEntries', () => {
		const createTools = (
			externalToolMock?: Partial<ExternalTool>,
			schoolExternalToolMock?: Partial<SchoolExternalTool>,
			contextExternalToolMock?: Partial<ContextExternalTool>
		) => {
			const externalTool: ExternalTool = new ExternalTool({
				...externalToolFactory.buildWithId(),
				...externalToolMock,
			});
			const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
				...schoolExternalToolFactory.buildWithId(),
				...schoolExternalToolMock,
			});
			const schoolExternalToolId = schoolExternalTool.id as string;
			const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
				...contextExternalToolFactory.buildWithId(),
				...contextExternalToolMock,
			});

			return {
				externalTool,
				schoolExternalTool,
				schoolExternalToolId,
				contextExternalTool,
			};
		};

		describe('when checking parameter is required', () => {
			describe('and given parameter is not optional and parameter value is empty', () => {
				const setup = () => {
					const requiredParam: CustomParameter = customParameterFactory.build({
						name: 'requiredParam',
						scope: CustomParameterScope.SCHOOL,
						type: CustomParameterType.STRING,
						isOptional: false,
					});
					const { externalTool, schoolExternalTool } = createTools(
						{
							parameters: [requiredParam],
						},
						{
							parameters: [{ name: 'requiredParam', value: '' }],
						}
					);

					return {
						externalTool,
						schoolExternalTool,
					};
				};

				it('should throw error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const func = () => service.checkCustomParameterEntries(externalTool, schoolExternalTool);

					expect(func).toThrowError('tool_param_required');
				});
			});
		});

		describe('when checking parameters of school external tool', () => {
			const setup = () => {
				const requiredContextParam: CustomParameter = customParameterFactory.build({
					name: 'missingContextParam',
					isOptional: false,
					scope: CustomParameterScope.CONTEXT,
					type: CustomParameterType.BOOLEAN,
				});
				const schoolParam: CustomParameter = customParameterFactory.build({
					name: 'schoolParam',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.BOOLEAN,
				});

				const { externalTool, schoolExternalTool } = createTools(
					{ parameters: [requiredContextParam, schoolParam] },
					{
						parameters: [{ name: 'schoolParam', value: 'true' }],
					}
				);

				return {
					externalTool,
					schoolExternalTool,
				};
			};

			it('should not fail because of missing required context param', () => {
				const { externalTool, schoolExternalTool } = setup();

				const func = () => service.checkCustomParameterEntries(externalTool, schoolExternalTool);

				expect(func).not.toThrowError();
			});
		});

		describe('when parameter is not school or context', () => {
			const setup = () => {
				const notSchoolParam: CustomParameter = customParameterFactory.build({
					name: 'notSchoolParam',
					scope: CustomParameterScope.GLOBAL,
					type: CustomParameterType.BOOLEAN,
				});

				const { externalTool, schoolExternalTool } = createTools(
					{ parameters: [notSchoolParam] },
					{
						parameters: [{ name: 'name', value: 'true' }],
					}
				);

				return {
					externalTool,
					schoolExternalTool,
				};
			};

			it('should return without any error', () => {
				const { externalTool, schoolExternalTool } = setup();

				const func = () => service.checkCustomParameterEntries(externalTool, schoolExternalTool);

				expect(func).not.toThrowError();
			});
		});

		describe('when parameter scope is school', () => {
			describe('when required parameter is missing', () => {
				const setup = () => {
					const missingParam: CustomParameter = customParameterFactory.build({
						name: 'isMissing',
						isOptional: false,
						scope: CustomParameterScope.SCHOOL,
					});

					const { externalTool, schoolExternalTool } = createTools(
						{ parameters: [missingParam] },
						{
							parameters: [{ name: 'anotherParam', value: 'value' }],
						}
					);

					return {
						externalTool,
						schoolExternalTool,
					};
				};

				it('should throw error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const func = () => service.checkCustomParameterEntries(externalTool, schoolExternalTool);

					expect(func).toThrowError('tool_param_required');
				});
			});

			describe('when parameter is optional but is missing on params', () => {
				const setup = () => {
					const param: CustomParameter = customParameterFactory.build({
						name: 'notChecked',
						scope: CustomParameterScope.SCHOOL,
						isOptional: true,
					});

					const { externalTool, schoolExternalTool } = createTools(
						{ parameters: [param] },
						{
							parameters: [{ name: 'anotherParam', value: 'value' }],
						}
					);

					return {
						externalTool,
						schoolExternalTool,
					};
				};

				it('should return without error ', () => {
					const { externalTool, schoolExternalTool } = setup();

					const func = () => service.checkCustomParameterEntries(externalTool, schoolExternalTool);

					expect(func).not.toThrowError('tool_param_required');
				});
			});
		});

		describe('when parameter scope is context', () => {
			describe('when required parameter is missing', () => {
				const setup = () => {
					const missingParam: CustomParameter = customParameterFactory.build({
						name: 'isMissing',
						isOptional: false,
						scope: CustomParameterScope.CONTEXT,
					});

					const { externalTool, contextExternalTool } = createTools(
						{
							parameters: [missingParam],
						},
						undefined,
						{
							parameters: [{ name: 'anotherParam', value: 'value' }],
						}
					);

					return {
						externalTool,
						contextExternalTool,
					};
				};

				it('should throw error', () => {
					const { externalTool, contextExternalTool } = setup();

					const func = () => service.checkCustomParameterEntries(externalTool, contextExternalTool);

					expect(func).toThrowError('tool_param_required');
				});
			});

			describe('when parameter is optional but is missing on params', () => {
				const setup = () => {
					const param: CustomParameter = customParameterFactory.build({
						name: 'notChecked',
						scope: CustomParameterScope.CONTEXT,
						isOptional: true,
					});

					const { externalTool, contextExternalTool } = createTools(
						{
							parameters: [param],
						},
						undefined,
						{
							parameters: [{ name: 'anotherParam', value: 'value' }],
						}
					);

					return {
						externalTool,
						contextExternalTool,
					};
				};

				it('should return without error ', () => {
					const { externalTool, contextExternalTool } = setup();

					const func = () => service.checkCustomParameterEntries(externalTool, contextExternalTool);

					expect(func).not.toThrowError('tool_param_required');
				});
			});
		});

		describe('when checking parameter type string', () => {
			const setup = () => {
				const correctTypeParam: CustomParameter = customParameterFactory.build({
					name: 'correctType',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.STRING,
				});

				const { externalTool, schoolExternalTool } = createTools(
					{ parameters: [correctTypeParam] },
					{
						parameters: [{ name: correctTypeParam.name, value: 'dasIstEinString' }],
					}
				);

				return {
					externalTool,
					schoolExternalTool,
				};
			};

			it('should return without error', () => {
				const { externalTool, schoolExternalTool } = setup();

				const func = () => service.checkCustomParameterEntries(externalTool, schoolExternalTool);

				expect(func).not.toThrowError('tool_param_type_mismatch');
			});
		});

		describe('when checking parameter type number', () => {
			describe('when type matches param value', () => {
				const setup = () => {
					const correctTypeParam: CustomParameter = customParameterFactory.build({
						name: 'correctType',
						scope: CustomParameterScope.SCHOOL,
						type: CustomParameterType.NUMBER,
					});

					const { externalTool, schoolExternalTool } = createTools(
						{ parameters: [correctTypeParam] },
						{
							parameters: [{ name: correctTypeParam.name, value: '1234' }],
						}
					);

					return {
						externalTool,
						schoolExternalTool,
					};
				};

				it('should return without error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const func = () => service.checkCustomParameterEntries(externalTool, schoolExternalTool);

					expect(func).not.toThrowError('tool_param_type_mismatch');
				});
			});

			describe('when type not matches param value', () => {
				const setup = () => {
					const wrongTypeParam: CustomParameter = customParameterFactory.build({
						name: 'wrongType',
						scope: CustomParameterScope.SCHOOL,
						type: CustomParameterType.NUMBER,
					});

					const { externalTool, schoolExternalTool } = createTools(
						{ parameters: [wrongTypeParam] },
						{
							parameters: [{ name: wrongTypeParam.name, value: '17271hsadas' }],
						}
					);

					return {
						externalTool,
						schoolExternalTool,
					};
				};

				it('should throw error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const func = () => service.checkCustomParameterEntries(externalTool, schoolExternalTool);

					expect(func).toThrowError('tool_param_type_mismatch');
				});
			});
		});

		describe('when checking parameter type boolean', () => {
			describe('when type matches param value', () => {
				const setup = () => {
					const correctTypeParam: CustomParameter = customParameterFactory.build({
						name: 'correctType',
						scope: CustomParameterScope.SCHOOL,
						type: CustomParameterType.BOOLEAN,
					});

					const { externalTool, schoolExternalTool } = createTools(
						{ parameters: [correctTypeParam] },
						{
							parameters: [{ name: correctTypeParam.name, value: 'true' }],
						}
					);

					return {
						externalTool,
						schoolExternalTool,
					};
				};

				it('should return without error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const func = () => service.checkCustomParameterEntries(externalTool, schoolExternalTool);

					expect(func).not.toThrowError('tool_param_type_mismatch');
				});
			});

			describe('when type not matches param value', () => {
				const setup = () => {
					const wrongTypeParam: CustomParameter = customParameterFactory.build({
						name: 'wrongType',
						scope: CustomParameterScope.SCHOOL,
						type: CustomParameterType.BOOLEAN,
					});

					const { externalTool, schoolExternalTool } = createTools(
						{ parameters: [wrongTypeParam] },
						{
							parameters: [{ name: wrongTypeParam.name, value: '17271hsadas' }],
						}
					);

					return {
						externalTool,
						schoolExternalTool,
					};
				};

				it('should throw error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const func = () => service.checkCustomParameterEntries(externalTool, schoolExternalTool);

					expect(func).toThrowError('tool_param_type_mismatch');
				});
			});
		});

		describe('when checking parameter type auto_contextId', () => {
			const setup = () => {
				const correctTypeParam: CustomParameter = customParameterFactory.build({
					name: 'correctType',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.AUTO_CONTEXTID,
				});

				const { externalTool, schoolExternalTool } = createTools(
					{ parameters: [correctTypeParam] },
					{
						parameters: [{ name: correctTypeParam.name, value: 'irgendeineId123' }],
					}
				);

				return {
					externalTool,
					schoolExternalTool,
				};
			};

			it('should return without error', () => {
				const { externalTool, schoolExternalTool } = setup();

				const func = () => service.checkCustomParameterEntries(externalTool, schoolExternalTool);

				expect(func).not.toThrowError('tool_param_type_mismatch');
			});
		});

		describe('when checking parameter type auto_contextName', () => {
			const setup = () => {
				const correctTypeParam: CustomParameter = customParameterFactory.build({
					name: 'correctType',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.AUTO_CONTEXTNAME,
				});

				const { externalTool, schoolExternalTool } = createTools(
					{ parameters: [correctTypeParam] },
					{
						parameters: [{ name: correctTypeParam.name, value: 'irgendeineId123' }],
					}
				);

				return {
					externalTool,
					schoolExternalTool,
				};
			};

			it('should return without error', () => {
				const { externalTool, schoolExternalTool } = setup();

				const func = () => service.checkCustomParameterEntries(externalTool, schoolExternalTool);

				expect(func).not.toThrowError('tool_param_type_mismatch');
			});
		});

		describe('when checking parameter type auto_schoolId', () => {
			const setup = () => {
				const correctTypeParam: CustomParameter = customParameterFactory.build({
					name: 'correctType',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.AUTO_SCHOOLID,
				});

				const { externalTool, schoolExternalTool } = createTools(
					{ parameters: [correctTypeParam] },
					{
						parameters: [{ name: correctTypeParam.name, value: 'irgendeineId123' }],
					}
				);

				return {
					externalTool,
					schoolExternalTool,
				};
			};

			it('should return without error', () => {
				const { externalTool, schoolExternalTool } = setup();

				const func = () => service.checkCustomParameterEntries(externalTool, schoolExternalTool);

				expect(func).not.toThrowError('tool_param_type_mismatch');
			});
		});

		describe('when checking parameter type auto_schoolnumber', () => {
			const setup = () => {
				const correctTypeParam: CustomParameter = customParameterFactory.build({
					name: 'correctType',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.AUTO_SCHOOLNUMBER,
				});

				const { externalTool, schoolExternalTool } = createTools(
					{ parameters: [correctTypeParam] },
					{
						parameters: [{ name: correctTypeParam.name, value: 'irgendeineId123' }],
					}
				);

				return {
					externalTool,
					schoolExternalTool,
				};
			};

			it('should return without error', () => {
				const { externalTool, schoolExternalTool } = setup();

				const func = () => service.checkCustomParameterEntries(externalTool, schoolExternalTool);

				expect(func).not.toThrowError('tool_param_type_mismatch');
			});
		});

		describe('when validating regex', () => {
			describe('when no regex is given', () => {
				const setup = () => {
					const undefinedRegex: CustomParameter = customParameterFactory.build({
						name: 'undefinedRegex',
						scope: CustomParameterScope.SCHOOL,
						type: CustomParameterType.STRING,
						regex: undefined,
					});
					const { externalTool, schoolExternalTool } = createTools(
						{
							parameters: [undefinedRegex],
						},
						{
							parameters: [{ name: 'undefinedRegex', value: 'xxxx' }],
						}
					);

					return {
						externalTool,
						schoolExternalTool,
					};
				};

				it('return without error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const func = () => service.checkCustomParameterEntries(externalTool, schoolExternalTool);

					expect(func).not.toThrowError('tool_param_value_regex');
				});
			});

			describe('when regex is given and param value is valid', () => {
				const setup = () => {
					const validRegex: CustomParameter = customParameterFactory.build({
						name: 'validRegex',
						scope: CustomParameterScope.SCHOOL,
						type: CustomParameterType.STRING,
						regex: '[x]',
					});
					const { externalTool, schoolExternalTool } = createTools(
						{
							parameters: [validRegex],
						},
						{
							parameters: [{ name: 'validRegex', value: 'xxxx' }],
						}
					);

					return {
						externalTool,
						schoolExternalTool,
					};
				};

				it('should return without error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const func = () => service.checkCustomParameterEntries(externalTool, schoolExternalTool);

					expect(func).not.toThrowError('tool_param_value_regex');
				});
			});

			describe('when regex is given and param value is invalid', () => {
				const setup = () => {
					const validRegex: CustomParameter = customParameterFactory.build({
						name: 'validRegex',
						scope: CustomParameterScope.SCHOOL,
						type: CustomParameterType.STRING,
						regex: '[x]',
					});
					const { externalTool, schoolExternalTool } = createTools(
						{
							parameters: [validRegex],
						},
						{
							parameters: [{ name: 'validRegex', value: 'abcdefasdhasd' }],
						}
					);

					return {
						externalTool,
						schoolExternalTool,
					};
				};

				it('should throw error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const func = () => service.checkCustomParameterEntries(externalTool, schoolExternalTool);

					expect(func).toThrowError('tool_param_value_regex');
				});
			});
		});
	});
});
