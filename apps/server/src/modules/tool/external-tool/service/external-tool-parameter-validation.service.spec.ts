import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common';
import {
	customParameterDOFactory,
	externalToolDOFactory,
} from '@shared/testing/factory/domainobject/tool/external-tool.factory';
import { ExternalToolService } from './index';
import { ExternalToolParameterValidationService } from './external-tool-parameter-validation.service';
import { CustomParameterScope, CustomParameterType } from '../entity';
import { ExternalToolDO, CustomParameterDO } from '../domainobject';

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

	describe('validateCommon is called', () => {
		describe('when tool is valid', () => {
			it('should return without exception', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withCustomParameters(1, { default: 'test', regex: '[t]', regexComment: 'testComment' })
					.buildWithId();
				externalToolService.findExternalToolByName.mockResolvedValue(externalToolDO);

				const result: Promise<void> = service.validateCommon(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});
		});

		describe('when checking if tool name is unique', () => {
			it('should throw an exception when name already exists', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.build({ name: 'sameName' });
				const existingExternalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId({ name: 'sameName' });
				externalToolService.findExternalToolByName.mockResolvedValue(existingExternalToolDO);

				const result: Promise<void> = service.validateCommon(externalToolDO);

				await expect(result).rejects.toThrow(
					new ValidationError(`tool_name_duplicate: The tool name "${externalToolDO.name}" is already used.`)
				);
			});

			it('should return when tool name is undefined', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.build({
					name: undefined,
					parameters: [
						customParameterDOFactory.build({ name: 'sameKey', scope: CustomParameterScope.SCHOOL }),
						customParameterDOFactory.build({ name: 'notSameKey', scope: CustomParameterScope.SCHOOL }),
					],
				});

				const func = () => service.validateCommon(externalToolDO);

				await expect(func()).resolves.not.toThrow();
			});
		});

		describe('when there is an empty parameter name', () => {
			it('should throw ValidationError', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.build({
					parameters: [customParameterDOFactory.build({ name: '' })],
				});
				externalToolService.findExternalToolByName.mockResolvedValue(null);

				const func = () => service.validateCommon(externalToolDO);

				await expect(func()).rejects.toThrow(
					new ValidationError(
						`tool_param_name: The tool ${externalToolDO.name} is missing at least one custom parameter name.`
					)
				);
			});
		});

		describe('when there are duplicate attributes', () => {
			it('should fail for two equal parameters', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.build({
					parameters: [
						customParameterDOFactory.build({ name: 'paramEqual' }),
						customParameterDOFactory.build({ name: 'paramEqual' }),
					],
				});
				externalToolService.findExternalToolByName.mockResolvedValue(null);

				const func = () => service.validateCommon(externalToolDO);

				await expect(func()).rejects.toThrow(
					new ValidationError(
						`tool_param_duplicate: The tool ${externalToolDO.name} contains multiple of the same custom parameters.`
					)
				);
			});

			it('should fail for names that only differ in capitalisation', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.build({
					parameters: [
						customParameterDOFactory.build({ name: 'param1CaseSensitive' }),
						customParameterDOFactory.build({ name: 'Param1casesensitive' }),
					],
				});
				externalToolService.findExternalToolByName.mockResolvedValue(null);

				const result: Promise<void> = service.validateCommon(externalToolDO);

				await expect(result).rejects.toThrow(
					new ValidationError(
						`tool_param_duplicate: The tool ${externalToolDO.name} contains multiple of the same custom parameters.`
					)
				);
			});
		});

		describe('when regex is invalid', () => {
			it('throw when external tools has a faulty regular expression', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(1, { regex: '[' }).build();
				externalToolService.findExternalToolByName.mockResolvedValue(null);

				const func = () => service.validateCommon(externalToolDO);

				await expect(func()).rejects.toThrow(
					new ValidationError(
						`tool_param_regex_invalid: A custom Parameter of the tool ${externalToolDO.name} has wrong regex attribute.`
					)
				);
			});
		});

		describe('when default value does not match regex', () => {
			it('should throw', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withCustomParameters(1, { default: 'es', regex: '[t]', regexComment: 'mockComment' })
					.buildWithId();
				externalToolService.findExternalToolByName.mockResolvedValue(null);

				const func = () => service.validateCommon(externalToolDO);

				await expect(func()).rejects.toThrow('tool_param_default_regex:');
			});
		});

		describe('when regex is set but regex comment is missing', () => {
			it('should throw exception', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withCustomParameters(1, { regex: '.', scope: CustomParameterScope.SCHOOL })
					.build();
				externalToolService.findExternalToolByName.mockResolvedValue(null);

				const result: Promise<void> = service.validateCommon(externalToolDO);

				await expect(result).rejects.toThrow(
					new ValidationError(
						`tool_param_regexComment: The "${
							(externalToolDO.parameters as CustomParameterDO[])[0].name
						}" parameter is missing a regex comment.`
					)
				);
			});
		});

		describe('when parameters has a parameter with scope global', () => {
			describe('when parameter has a default value', () => {
				const setup = () => {
					const externalToolDO: ExternalToolDO = externalToolDOFactory
						.withCustomParameters(1, {
							scope: CustomParameterScope.GLOBAL,
							default: 'defaultValue',
						})
						.build();

					externalToolService.findExternalToolByName.mockResolvedValue(null);

					return {
						externalToolDO,
					};
				};

				it('should pass', async () => {
					const { externalToolDO } = setup();

					const result: Promise<void> = service.validateCommon(externalToolDO);

					await expect(result).resolves.not.toThrow();
				});
			});

			describe('when defaultValue is empty', () => {
				const setup = () => {
					const externalToolDO: ExternalToolDO = externalToolDOFactory
						.withCustomParameters(1, {
							scope: CustomParameterScope.GLOBAL,
							default: undefined,
						})
						.build();

					externalToolService.findExternalToolByName.mockResolvedValue(null);

					return {
						externalToolDO,
					};
				};

				it('should throw an exception', async () => {
					const { externalToolDO } = setup();

					const result: Promise<void> = service.validateCommon(externalToolDO);

					await expect(result).rejects.toThrow(
						new ValidationError(
							`tool_param_default_required: The "${
								(externalToolDO.parameters as CustomParameterDO[])[0].name
							}" is a global parameter and requires a default value.`
						)
					);
				});
			});

			describe('when the defaultValue is undefined', () => {
				const setup = () => {
					const externalToolDO: ExternalToolDO = externalToolDOFactory
						.withCustomParameters(1, {
							scope: CustomParameterScope.GLOBAL,
							default: '',
						})
						.build();

					externalToolService.findExternalToolByName.mockResolvedValue(null);

					return {
						externalToolDO,
					};
				};

				it('should throw an exception', async () => {
					const { externalToolDO } = setup();

					const result: Promise<void> = service.validateCommon(externalToolDO);

					await expect(result).rejects.toThrow(
						new ValidationError(
							`tool_param_default_required: The "${
								(externalToolDO.parameters as CustomParameterDO[])[0].name
							}" is a global parameter and requires a default value.`
						)
					);
				});
			});

			describe('when the type is an auto type', () => {
				const setup = () => {
					const externalToolDO: ExternalToolDO = externalToolDOFactory
						.withCustomParameters(1, {
							scope: CustomParameterScope.GLOBAL,
							type: CustomParameterType.AUTO_CONTEXTID,
							default: undefined,
						})
						.build();

					externalToolService.findExternalToolByName.mockResolvedValue(null);

					return {
						externalToolDO,
					};
				};

				it('should pass without a default', async () => {
					const { externalToolDO } = setup();

					const result: Promise<void> = service.validateCommon(externalToolDO);

					await expect(result).resolves.not.toThrow();
				});
			});
		});

		describe('when a auto parameter is not in scope global', () => {
			const setup = () => {
				const parameter: CustomParameterDO = customParameterDOFactory.build({
					type: CustomParameterType.AUTO_SCHOOLID,
					scope: CustomParameterScope.SCHOOL,
				});

				const externalToolDO: ExternalToolDO = externalToolDOFactory.build({ parameters: [parameter] });

				externalToolService.findExternalToolByName.mockResolvedValue(null);

				return {
					externalToolDO,
					parameter,
				};
			};

			it('should throw exception', async () => {
				const { externalToolDO, parameter } = setup();

				const result: Promise<void> = service.validateCommon(externalToolDO);

				await expect(result).rejects.toThrow(
					new ValidationError(
						`tool_param_auto_requires_global: The "${parameter.name}" with type "${parameter.type}" must have the scope "global", since it is automatically filled.`
					)
				);
			});
		});
	});
});
