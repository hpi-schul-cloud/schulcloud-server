import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common/error';
import { CustomParameter } from '../../common/domain';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '../../common/enum';
import { CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../domain';
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

	describe('validateCommon', () => {
		describe('when tool is valid', () => {
			it('should return without exception', async () => {
				const externalTool: ExternalTool = externalToolFactory
					.withCustomParameters(1, { default: 'test', regex: '[t]', regexComment: 'testComment' })
					.buildWithId();
				externalToolService.findExternalToolsByName.mockResolvedValue([externalTool]);

				const result: Promise<void> = service.validateCommon(externalTool);

				await expect(result).resolves.not.toThrow();
			});
		});

		describe('when checking if tool name is unique', () => {
			it('should throw an exception when name already exists', async () => {
				const externalTool: ExternalTool = externalToolFactory.build({ name: 'sameName' });
				const existingExternalToolDO: ExternalTool = externalToolFactory.buildWithId({ name: 'sameName' });
				externalToolService.findExternalToolsByName.mockResolvedValue([existingExternalToolDO]);

				const result: Promise<void> = service.validateCommon(externalTool);

				await expect(result).rejects.toThrow(
					new ValidationError(`tool_name_duplicate: The tool name "${externalTool.name}" is already used.`)
				);
			});

			it('should return when tool name is undefined', async () => {
				const externalTool: ExternalTool = externalToolFactory.build({
					name: undefined,
				});

				const func = () => service.validateCommon(externalTool);

				await expect(func()).resolves.not.toThrow();
			});
		});

		describe('when there is an empty parameter name', () => {
			it('should throw ValidationError', async () => {
				const externalTool: ExternalTool = externalToolFactory.build({
					parameters: [customParameterFactory.build({ name: '' })],
				});
				externalToolService.findExternalToolsByName.mockResolvedValue([]);

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
				externalToolService.findExternalToolsByName.mockResolvedValue([]);

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
				externalToolService.findExternalToolsByName.mockResolvedValue([]);

				const result: Promise<void> = service.validateCommon(externalTool);

				await expect(result).rejects.toThrow(
					new ValidationError(
						`tool_param_duplicate: The tool ${externalTool.name} contains multiple of the same custom parameters.`
					)
				);
			});
		});

		describe('when regex is invalid', () => {
			it('throw when external tools has a faulty regular expression', async () => {
				const externalTool: ExternalTool = externalToolFactory
					.withCustomParameters(1, { regex: '[', regexComment: 'not a regex' })
					.build();
				externalToolService.findExternalToolsByName.mockResolvedValue([]);

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
				externalToolService.findExternalToolsByName.mockResolvedValue([]);

				const func = () => service.validateCommon(externalTool);

				await expect(func()).rejects.toThrow('tool_param_default_regex:');
			});
		});

		describe('when regex is set but regex comment is missing', () => {
			it('should throw exception', async () => {
				const externalTool: ExternalTool = externalToolFactory
					.withCustomParameters(1, { regex: '.', scope: CustomParameterScope.SCHOOL })
					.build();
				externalToolService.findExternalToolsByName.mockResolvedValue([]);

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
			describe('when parameter has a default value', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory
						.withCustomParameters(1, {
							scope: CustomParameterScope.GLOBAL,
							default: 'defaultValue',
						})
						.build();

					externalToolService.findExternalToolsByName.mockResolvedValue([]);

					return {
						externalTool,
					};
				};

				it('should pass', async () => {
					const { externalTool } = setup();

					const result: Promise<void> = service.validateCommon(externalTool);

					await expect(result).resolves.not.toThrow();
				});
			});

			describe('when defaultValue is undefined', () => {
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory
						.withCustomParameters(1, {
							scope: CustomParameterScope.GLOBAL,
							default: undefined,
						})
						.build();

					externalToolService.findExternalToolsByName.mockResolvedValue([]);

					return {
						externalTool,
					};
				};

				it('should throw an exception', async () => {
					const { externalTool } = setup();

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
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory
						.withCustomParameters(1, {
							scope: CustomParameterScope.GLOBAL,
							default: '',
						})
						.build();

					externalToolService.findExternalToolsByName.mockResolvedValue([]);

					return {
						externalTool,
					};
				};

				it('should throw an exception', async () => {
					const { externalTool } = setup();

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
				const setup = () => {
					const externalTool: ExternalTool = externalToolFactory
						.withCustomParameters(1, {
							scope: CustomParameterScope.GLOBAL,
							type: CustomParameterType.AUTO_CONTEXTID,
							default: undefined,
						})
						.build();

					externalToolService.findExternalToolsByName.mockResolvedValue([]);

					return {
						externalTool,
					};
				};

				it('should pass without a default', async () => {
					const { externalTool } = setup();

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

				externalToolService.findExternalToolsByName.mockResolvedValue([]);

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

				externalToolService.findExternalToolsByName.mockResolvedValue([externalTool]);

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

					externalToolService.findExternalToolsByName.mockResolvedValue([externalTool]);

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

					externalToolService.findExternalToolsByName.mockResolvedValue([externalTool]);

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

					externalToolService.findExternalToolsByName.mockResolvedValue([externalTool]);

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

					externalToolService.findExternalToolsByName.mockResolvedValue([externalTool]);

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
		describe('when there exists no other external tools with the same name', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build({ name: 'test-name' });

				externalToolService.findExternalToolsByName.mockResolvedValue([]);

				return { externalTool };
			};

			it('should return true', async () => {
				const { externalTool } = setup();

				const result = await service.isNameUnique(externalTool);

				expect(result).toBe(true);
			});
		});

		describe('when the only external tool with the same name is the tool itself', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build({ name: 'test-name' });

				externalToolService.findExternalToolsByName.mockResolvedValue([externalTool]);

				return { externalTool };
			};

			it('should return true', async () => {
				const { externalTool } = setup();

				const result = await service.isNameUnique(externalTool);

				expect(result).toBe(true);
			});
		});

		describe('when there exists other external tools with the same name', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build({ name: 'test-name' });
				const existingExternalTool: ExternalTool = externalToolFactory.build({ name: 'test-name' });

				externalToolService.findExternalToolsByName.mockResolvedValue([externalTool, existingExternalTool]);

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
