import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common';
import {
	contextExternalToolFactory,
	customParameterFactory,
	externalToolFactory,
	schoolExternalToolFactory,
} from '@shared/testing';
import { ContextExternalTool } from '../../../context-external-tool/domain';
import { ExternalTool } from '../../../external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { CustomParameter } from '../../domain';
import { CustomParameterScope, CustomParameterType } from '../../enum';
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

		describe('when a parameter is a duplicate', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					parameters: [
						customParameterFactory.build({
							name: 'duplicate',
							scope: CustomParameterScope.SCHOOL,
							type: CustomParameterType.STRING,
							isOptional: true,
						}),
					],
				});
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
					parameters: [
						{ name: 'duplicate', value: undefined },
						{ name: 'duplicate', value: undefined },
					],
				});

				return {
					externalTool,
					schoolExternalTool,
				};
			};

			it('should return an error', () => {
				const { externalTool, schoolExternalTool } = setup();

				const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

				expect(result).toContainEqual(
					expect.objectContaining<Partial<ValidationError>>({
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						message: expect.stringContaining('tool_param_duplicate'),
					})
				);
			});
		});

		describe('when a parameter is unknown', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					parameters: [],
				});
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
					parameters: [{ name: 'unknownParameter', value: undefined }],
				});

				return {
					externalTool,
					schoolExternalTool,
				};
			};

			it('should return an error', () => {
				const { externalTool, schoolExternalTool } = setup();

				const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

				expect(result).toContainEqual(
					expect.objectContaining<Partial<ValidationError>>({
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						message: expect.stringContaining('tool_param_unknown'),
					})
				);
			});
		});

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

				it('should return an error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

					expect(result).toContainEqual(
						expect.objectContaining<Partial<ValidationError>>({
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							message: expect.stringContaining('tool_param_value_missing'),
						})
					);
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

			it('should return without any error', () => {
				const { externalTool, schoolExternalTool } = setup();

				const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

				expect(result).toHaveLength(0);
			});
		});

		describe('when parameter is not school or context', () => {
			const setup = () => {
				const { externalTool, schoolExternalTool } = createTools(
					{
						parameters: [
							customParameterFactory.build({
								name: 'notSchoolParam',
								scope: CustomParameterScope.GLOBAL,
								type: CustomParameterType.BOOLEAN,
							}),
							customParameterFactory.build({
								name: 'schoolParam',
								scope: CustomParameterScope.SCHOOL,
								type: CustomParameterType.BOOLEAN,
							}),
						],
					},
					{
						parameters: [{ name: 'schoolParam', value: 'true' }],
					}
				);

				return {
					externalTool,
					schoolExternalTool,
				};
			};

			it('should return without any error', () => {
				const { externalTool, schoolExternalTool } = setup();

				const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

				expect(result).toHaveLength(0);
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
							parameters: [],
						}
					);

					return {
						externalTool,
						schoolExternalTool,
					};
				};

				it('should return an error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

					expect(result).toContainEqual(
						expect.objectContaining<Partial<ValidationError>>({
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							message: expect.stringContaining('tool_param_required'),
						})
					);
				});
			});

			describe('when parameter is optional and was not defined', () => {
				const setup = () => {
					const { externalTool, schoolExternalTool } = createTools(
						{
							parameters: [
								customParameterFactory.build({
									name: 'optionalParameter',
									scope: CustomParameterScope.SCHOOL,
									isOptional: true,
								}),
								customParameterFactory.build({
									name: 'requiredParameter',
									scope: CustomParameterScope.SCHOOL,
									type: CustomParameterType.STRING,
									isOptional: false,
								}),
							],
						},
						{
							parameters: [{ name: 'requiredParameter', value: 'value' }],
						}
					);

					return {
						externalTool,
						schoolExternalTool,
					};
				};

				it('should return without any error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

					expect(result).toHaveLength(0);
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
							parameters: [],
						}
					);

					return {
						externalTool,
						contextExternalTool,
					};
				};

				it('should return an error', () => {
					const { externalTool, contextExternalTool } = setup();

					const result: ValidationError[] = service.validateParameters(externalTool, contextExternalTool);

					expect(result).toContainEqual(
						expect.objectContaining<Partial<ValidationError>>({
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							message: expect.stringContaining('tool_param_required'),
						})
					);
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
							parameters: [],
						}
					);

					return {
						externalTool,
						contextExternalTool,
					};
				};

				it('should return without any error', () => {
					const { externalTool, contextExternalTool } = setup();

					const result: ValidationError[] = service.validateParameters(externalTool, contextExternalTool);

					expect(result).toHaveLength(0);
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

			it('should return without any error', () => {
				const { externalTool, schoolExternalTool } = setup();

				const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

				expect(result).toHaveLength(0);
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

				it('should return without any error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

					expect(result).toHaveLength(0);
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

				it('should return an error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

					expect(result).toContainEqual(
						expect.objectContaining<Partial<ValidationError>>({
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							message: expect.stringContaining('tool_param_type_mismatch'),
						})
					);
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

				it('should return without any error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

					expect(result).toHaveLength(0);
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

				it('should return an error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

					expect(result).toContainEqual(
						expect.objectContaining<Partial<ValidationError>>({
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							message: expect.stringContaining('tool_param_type_mismatch'),
						})
					);
				});
			});
		});

		describe('when validating regex', () => {
			describe('when no regex is given', () => {
				const setup = () => {
					const undefinedRegex: CustomParameter = customParameterFactory.build({
						name: 'undefinedRegex',
						isOptional: false,
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

				it('should return without any error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

					expect(result).toHaveLength(0);
				});
			});

			describe('when regex is given and param value is valid', () => {
				const setup = () => {
					const validRegex: CustomParameter = customParameterFactory.build({
						name: 'validRegex',
						isOptional: false,
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

				it('should return without any error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

					expect(result).toHaveLength(0);
				});
			});

			describe('when regex is given and param value is invalid', () => {
				const setup = () => {
					const validRegex: CustomParameter = customParameterFactory.build({
						name: 'validRegex',
						isOptional: false,
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

				it('should return an error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

					expect(result).toContainEqual(
						expect.objectContaining<Partial<ValidationError>>({
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							message: expect.stringContaining('tool_param_value_regex'),
						})
					);
				});
			});

			describe('when parameter is optional and a regex is given, but the param value is undefined', () => {
				const setup = () => {
					const optionalRegex: CustomParameter = customParameterFactory.build({
						name: 'optionalRegex',
						isOptional: true,
						scope: CustomParameterScope.SCHOOL,
						type: CustomParameterType.STRING,
						regex: '[x]',
					});
					const { externalTool, schoolExternalTool } = createTools(
						{
							parameters: [optionalRegex],
						},
						{
							parameters: [],
						}
					);

					return {
						externalTool,
						schoolExternalTool,
					};
				};

				it('should return without any error', () => {
					const { externalTool, schoolExternalTool } = setup();

					const result: ValidationError[] = service.validateParameters(externalTool, schoolExternalTool);

					expect(result).toHaveLength(0);
				});
			});
		});
	});
});
