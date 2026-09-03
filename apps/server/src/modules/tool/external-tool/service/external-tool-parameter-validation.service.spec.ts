import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common/error';
import { type CustomParameter } from '../../common/domain';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '../../common/enum';
import { CommonToolValidationService } from '../../common/service';
import { type ExternalTool } from '../domain';
import { customParameterFactory, externalToolFactory } from '../testing';
import { ExternalToolParameterValidationService } from './external-tool-parameter-validation.service';
import { ExternalToolService } from './external-tool.service';

describe('ExternalToolParameterValidationService', () => {
	let module: TestingModule;
	let service: ExternalToolParameterValidationService;

	let externalToolService: DeepMocked<ExternalToolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolParameterValidationService,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: CommonToolValidationService,
					useValue: createMock<CommonToolValidationService>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolParameterValidationService);
		externalToolService = module.get(ExternalToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	type Scenario = {
		externalTool: ExternalTool;
		existingExternalTools: ExternalTool[];
	};

	const createScenario = (overrides: Partial<Scenario> = {}): Scenario => {
		const scenario: Scenario = {
			externalTool: externalToolFactory.build(),
			existingExternalTools: [],
			...overrides,
		};

		externalToolService.findExternalToolsByName.mockResolvedValue(scenario.existingExternalTools);

		return scenario;
	};

	describe('validateCommon', () => {
		describe('when tool is valid', () => {
			it('should return without exception', async () => {
				const externalTool: ExternalTool = externalToolFactory
					.withCustomParameters(1, { default: 'test', regex: '[t]', regexComment: 'testComment' })
					.buildWithId();
				createScenario({ externalTool, existingExternalTools: [externalTool] });

				const result: Promise<void> = service.validateCommon(externalTool);

				await expect(result).resolves.not.toThrow();
			});
		});

		describe('when checking if tool name is unique', () => {
			describe('when name already exists', () => {
				it('should throw an exception for non-medium tools', async () => {
					const externalTool: ExternalTool = externalToolFactory.build({ name: 'sameName' });
					const existingExternalToolDO: ExternalTool = externalToolFactory.buildWithId({ name: 'sameName' });
					createScenario({ externalTool, existingExternalTools: [existingExternalToolDO] });

					const result: Promise<void> = service.validateCommon(externalTool);

					await expect(result).rejects.toThrow(
						new ValidationError(`tool_name_duplicate: The tool name "${externalTool.name}" is already used.`)
					);
				});

				it('should allow the same name for external tools of different media', async () => {
					const externalTool: ExternalTool = externalToolFactory
						.withMedium({ mediumId: 'medium-2', mediaSourceId: 'media-source' })
						.build({ name: 'sameName' });
					const existingExternalToolDO: ExternalTool = externalToolFactory
						.withMedium({ mediumId: 'medium-1', mediaSourceId: 'media-source' })
						.buildWithId({ name: 'sameName' });
					createScenario({ externalTool, existingExternalTools: [existingExternalToolDO] });

					const result: Promise<void> = service.validateCommon(externalTool);

					await expect(result).resolves.not.toThrow();
				});

				it('should allow the same name for a medium tool and a non-medium tool', async () => {
					const externalTool: ExternalTool = externalToolFactory
						.withMedium({ mediumId: 'medium-1', mediaSourceId: 'media-source' })
						.build({ name: 'sameName' });
					const existingExternalToolDO: ExternalTool = externalToolFactory.buildWithId({ name: 'sameName' });
					createScenario({ externalTool, existingExternalTools: [existingExternalToolDO] });

					const result: Promise<void> = service.validateCommon(externalTool);

					await expect(result).resolves.not.toThrow();
				});
			});

			describe('when tool name is undefined', () => {
				it('should return without an exception', async () => {
					const externalTool: ExternalTool = externalToolFactory.build({
						name: undefined,
					});

					const func = () => service.validateCommon(externalTool);

					await expect(func()).resolves.not.toThrow();
				});
			});
		});

		describe('when there is an empty parameter name', () => {
			it('should throw ValidationError', async () => {
				const externalTool: ExternalTool = externalToolFactory.build({
					parameters: [customParameterFactory.build({ name: '' })],
				});
				createScenario({ externalTool });

				const func = () => service.validateCommon(externalTool);

				await expect(func()).rejects.toThrow(
					new ValidationError(`tool_param_name: A custom parameter is missing a name.`)
				);
			});
		});

		describe('when there are duplicate attributes', () => {
			it('should fail for two equal parameters', async () => {
				const externalTool: ExternalTool = externalToolFactory.build({
					parameters: [
						customParameterFactory.build({ name: 'paramEqual' }),
						customParameterFactory.build({ name: 'paramEqual' }),
					],
				});
				createScenario({ externalTool });

				const func = () => service.validateCommon(externalTool);

				await expect(func()).rejects.toThrow(
					new ValidationError(
						`tool_param_duplicate: The tool ${externalTool.name} contains multiple of the same custom parameters.`
					)
				);
			});

			it('should fail for names that only differ in capitalisation', async () => {
				const externalTool: ExternalTool = externalToolFactory.build({
					parameters: [
						customParameterFactory.build({ name: 'param1CaseSensitive' }),
						customParameterFactory.build({ name: 'Param1casesensitive' }),
					],
				});
				createScenario({ externalTool });

				const result: Promise<void> = service.validateCommon(externalTool);

				await expect(result).rejects.toThrow(
					new ValidationError(
						`tool_param_duplicate: The tool ${externalTool.name} contains multiple of the same custom parameters.`
					)
				);
			});
		});

		describe('when regex is invalid', () => {
			it('should throw for a faulty regular expression', async () => {
				const externalTool: ExternalTool = externalToolFactory
					.withCustomParameters(1, { regex: '[', regexComment: 'not a regex' })
					.build();
				createScenario({ externalTool });

				const func = () => service.validateCommon(externalTool);

				await expect(func()).rejects.toThrow(
					new ValidationError(
						`tool_param_regex_invalid: The custom Parameter "${
							externalTool.parameters?.[0].name ?? ''
						}" has an invalid regex.`
					)
				);
			});
		});

		describe('when default value does not match regex', () => {
			it('should throw', async () => {
				const externalTool: ExternalTool = externalToolFactory
					.withCustomParameters(1, { default: 'es', regex: '[t]', regexComment: 'mockComment' })
					.buildWithId();
				createScenario({ externalTool });

				const func = () => service.validateCommon(externalTool);

				await expect(func()).rejects.toThrow('tool_param_default_regex:');
			});
		});

		describe('when regex is set but regex comment is missing', () => {
			it('should throw exception', async () => {
				const externalTool: ExternalTool = externalToolFactory
					.withCustomParameters(1, { regex: '.', scope: CustomParameterScope.SCHOOL })
					.build();
				createScenario({ externalTool });

				const result: Promise<void> = service.validateCommon(externalTool);

				await expect(result).rejects.toThrow(
					new ValidationError(
						`tool_param_regexComment: The custom parameter "${
							externalTool.parameters?.[0].name ?? ''
						}" parameter is missing a regex comment.`
					)
				);
			});
		});

		describe('when parameters has a parameter with scope global', () => {
			const setupGlobalParameter = (overrides: { default?: string; type?: CustomParameterType } = {}) => {
				const externalTool: ExternalTool = externalToolFactory
					.withCustomParameters(1, {
						scope: CustomParameterScope.GLOBAL,
						...overrides,
					})
					.build();

				createScenario({ externalTool });

				return { externalTool };
			};

			describe('when parameter has a default value', () => {
				it('should pass', async () => {
					const { externalTool } = setupGlobalParameter({ default: 'defaultValue' });

					const result: Promise<void> = service.validateCommon(externalTool);

					await expect(result).resolves.not.toThrow();
				});
			});

			describe('when defaultValue is undefined', () => {
				it('should throw an exception', async () => {
					const { externalTool } = setupGlobalParameter({ default: undefined });

					const result: Promise<void> = service.validateCommon(externalTool);

					await expect(result).rejects.toThrow(
						new ValidationError(
							`tool_param_default_required: The custom parameter "${
								externalTool.parameters?.[0].name ?? ''
							}" is a global parameter and requires a default value.`
						)
					);
				});
			});

			describe('when the defaultValue is empty', () => {
				it('should throw an exception', async () => {
					const { externalTool } = setupGlobalParameter({ default: '' });

					const result: Promise<void> = service.validateCommon(externalTool);

					await expect(result).rejects.toThrow(
						new ValidationError(
							`tool_param_default_required: The custom parameter "${
								externalTool.parameters?.[0].name ?? ''
							}" is a global parameter and requires a default value.`
						)
					);
				});
			});

			describe('when the type is an auto type', () => {
				it('should pass without a default', async () => {
					const { externalTool } = setupGlobalParameter({
						type: CustomParameterType.AUTO_CONTEXTID,
						default: undefined,
					});

					const result: Promise<void> = service.validateCommon(externalTool);

					await expect(result).resolves.not.toThrow();
				});
			});
		});

		describe('when a auto parameter is not in scope global', () => {
			const setup = () => {
				const parameter: CustomParameter = customParameterFactory.build({
					type: CustomParameterType.AUTO_SCHOOLID,
					scope: CustomParameterScope.SCHOOL,
				});

				const externalTool: ExternalTool = externalToolFactory.build({ parameters: [parameter] });

				createScenario({ externalTool });

				return {
					externalTool,
					parameter,
				};
			};

			it('should throw exception', async () => {
				const { externalTool, parameter } = setup();

				const result: Promise<void> = service.validateCommon(externalTool);

				await expect(result).rejects.toThrow(
					new ValidationError(
						`tool_param_auto_requires_global: The custom parameter "${parameter.name}" with type "${parameter.type}" must have the scope "global", since it is automatically filled.`
					)
				);
			});
		});

		describe('when parameter has wrong type as default', () => {
			const setup = () => {
				const parameter = customParameterFactory.buildWithId({ default: 'test', type: CustomParameterType.NUMBER });
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ parameters: [parameter] });

				createScenario({ externalTool });

				return {
					externalTool,
					parameter,
				};
			};

			it('should throw exception', async () => {
				const { externalTool, parameter } = setup();

				const result: Promise<void> = service.validateCommon(externalTool);

				await expect(result).rejects.toThrow(
					new ValidationError(
						`tool_param_type_mismatch: The default value of the custom parameter "${parameter.name}" should be of type "${parameter.type}".`
					)
				);
			});
		});

		describe('when auto parameter is auto medium id', () => {
			describe('when medium id is not set', () => {
				const setup = () => {
					const parameter = customParameterFactory.buildWithId({
						type: CustomParameterType.AUTO_MEDIUMID,
						scope: CustomParameterScope.GLOBAL,
					});
					const externalTool: ExternalTool = externalToolFactory.buildWithId({
						parameters: [parameter],
						medium: undefined,
					});

					createScenario({ externalTool, existingExternalTools: [externalTool] });

					return {
						externalTool,
						parameter,
					};
				};

				it('should throw exception', async () => {
					const { externalTool, parameter } = setup();

					const result: Promise<void> = service.validateCommon(externalTool);

					await expect(result).rejects.toThrow(
						new ValidationError(
							`tool_param_auto_medium_id: The custom parameter "${parameter.name}" with type "${parameter.type}" must have the mediumId set.`
						)
					);
				});
			});

			describe('when medium id is set', () => {
				const setup = () => {
					const parameter = customParameterFactory.buildWithId({
						type: CustomParameterType.AUTO_MEDIUMID,
						scope: CustomParameterScope.GLOBAL,
					});
					const externalTool: ExternalTool = externalToolFactory.withMedium().buildWithId({
						parameters: [parameter],
					});

					createScenario({ externalTool, existingExternalTools: [externalTool] });

					return {
						externalTool,
						parameter,
					};
				};

				it('should not throw exception', async () => {
					const { externalTool } = setup();

					const result: Promise<void> = service.validateCommon(externalTool);

					await expect(result).resolves.not.toThrow();
				});
			});
		});

		describe('when there is parameter with fragment location', () => {
			describe('when there is only one parameter with fragment location', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.buildWithId({
						parameters: customParameterFactory.buildList(1, { location: CustomParameterLocation.FRAGMENT }),
					});

					createScenario({ externalTool, existingExternalTools: [externalTool] });

					return {
						externalTool,
					};
				};

				it('should not throw any exception', async () => {
					const { externalTool } = setup();

					const result = service.validateCommon(externalTool);

					await expect(result).resolves.not.toThrow();
				});
			});

			describe('when there are multiple parameters with fragment location', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory.buildWithId({
						parameters: customParameterFactory.buildList(2, { location: CustomParameterLocation.FRAGMENT }),
					});

					createScenario({ externalTool, existingExternalTools: [externalTool] });

					return {
						externalTool,
					};
				};

				it('should throw an ValidationError', async () => {
					const { externalTool } = setup();

					const result = service.validateCommon(externalTool);

					await expect(result).rejects.toThrow(
						new ValidationError(
							`tool_param_multiple_anchor_parameters: The tool ${externalTool.name} contains multiple anchor (URI fragment) custom parameters.`
						)
					);
				});
			});
		});
	});

	describe('isNameUnique', () => {
		describe('when the external tool has no name', () => {
			it('should return true without looking up tools', async () => {
				const externalTool: ExternalTool = externalToolFactory.build({ name: undefined });

				const result = await service.isNameUnique(externalTool);

				expect(result).toBe(true);
				expect(externalToolService.findExternalToolsByName).not.toHaveBeenCalled();
			});
		});

		describe('when the external tool belongs to a medium', () => {
			describe('when no other tool with the same name exists', () => {
				it('should return true', async () => {
					const externalTool: ExternalTool = externalToolFactory
						.withMedium({ mediumId: 'medium-1', mediaSourceId: 'media-source' })
						.build({ name: 'test-name' });
					createScenario({ externalTool });

					const result = await service.isNameUnique(externalTool);

					expect(result).toBe(true);
				});
			});

			describe('when the only matching tool is the same tool', () => {
				it('should return true', async () => {
					const externalTool: ExternalTool = externalToolFactory
						.withMedium({ mediumId: 'medium-1', mediaSourceId: 'media-source' })
						.buildWithId({ name: 'test-name' });
					createScenario({ externalTool, existingExternalTools: [externalTool] });

					const result = await service.isNameUnique(externalTool);

					expect(result).toBe(true);
				});
			});

			describe('when a non-medium tool has the same name', () => {
				it('should return true', async () => {
					const externalTool: ExternalTool = externalToolFactory
						.withMedium({ mediumId: 'medium-1', mediaSourceId: 'media-source' })
						.build({ name: 'test-name' });
					const existingExternalTool: ExternalTool = externalToolFactory.buildWithId({ name: 'test-name' });
					createScenario({ externalTool, existingExternalTools: [existingExternalTool] });

					const result = await service.isNameUnique(externalTool);

					expect(result).toBe(true);
				});
			});

			describe('when another medium tool has the same name but a different medium identity', () => {
				it('should return true', async () => {
					const externalTool: ExternalTool = externalToolFactory
						.withMedium({ mediumId: 'medium-2', mediaSourceId: 'media-source' })
						.build({ name: 'test-name' });
					const existingExternalTool: ExternalTool = externalToolFactory
						.withMedium({ mediumId: 'medium-1', mediaSourceId: 'media-source' })
						.buildWithId({ name: 'test-name' });
					createScenario({ externalTool, existingExternalTools: [existingExternalTool] });

					const result = await service.isNameUnique(externalTool);

					expect(result).toBe(true);
				});
			});

			describe('when another medium tool has the same name and medium identity', () => {
				it('should return false', async () => {
					const externalTool: ExternalTool = externalToolFactory
						.withMedium({ mediumId: 'medium-1', mediaSourceId: 'media-source' })
						.buildWithId({ name: 'test-name' });
					const existingExternalTool: ExternalTool = externalToolFactory
						.withMedium({ mediumId: 'medium-1', mediaSourceId: 'media-source' })
						.buildWithId({ name: 'test-name' });
					createScenario({ externalTool, existingExternalTools: [existingExternalTool] });

					const result = await service.isNameUnique(externalTool);

					expect(result).toBe(false);
				});
			});
		});

		describe('when there exists no other non-medium tool with the same name', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build({ name: 'test-name' });

				createScenario({ externalTool });

				return { externalTool };
			};

			it('should return true', async () => {
				const { externalTool } = setup();

				const result = await service.isNameUnique(externalTool);

				expect(result).toBe(true);
			});
		});

		describe('when only medium tools have the same name', () => {
			it('should return true for a non-medium tool', async () => {
				const externalTool: ExternalTool = externalToolFactory.build({ name: 'test-name' });
				const existingExternalTool: ExternalTool = externalToolFactory
					.withMedium({ mediumId: 'medium-1', mediaSourceId: 'media-source' })
					.buildWithId({ name: 'test-name' });
				createScenario({ externalTool, existingExternalTools: [existingExternalTool] });

				const result = await service.isNameUnique(externalTool);

				expect(result).toBe(true);
			});
		});

		describe('when the only non-medium tool with the same name is the tool itself', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build({ name: 'test-name' });

				createScenario({ externalTool, existingExternalTools: [externalTool] });

				return { externalTool };
			};

			it('should return true', async () => {
				const { externalTool } = setup();

				const result = await service.isNameUnique(externalTool);

				expect(result).toBe(true);
			});
		});

		describe('when there exists another non-medium tool with the same name', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build({ name: 'test-name' });
				const existingExternalTool: ExternalTool = externalToolFactory.build({ name: 'test-name' });

				createScenario({ externalTool, existingExternalTools: [externalTool, existingExternalTool] });

				return { externalTool };
			};

			it('should return false', async () => {
				const { externalTool } = setup();

				const result = await service.isNameUnique(externalTool);

				expect(result).toBe(false);
			});
		});
	});
});
