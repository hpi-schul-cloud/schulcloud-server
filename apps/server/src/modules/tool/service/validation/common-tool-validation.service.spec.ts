import {
	customParameterDOFactory,
	externalToolDOFactory,
} from '@shared/testing/factory/domainobject/external-tool.factory';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CustomParameterDO, ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { CustomParameterScope } from '@shared/domain';
import { ValidationError } from '@shared/common';
import { ExternalToolService } from '../external-tool.service';
import { CommonToolValidationService } from './common-tool-validation.service';

describe('CommonToolValidationService', () => {
	let module: TestingModule;
	let service: CommonToolValidationService;

	let externalToolService: DeepMocked<ExternalToolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonToolValidationService,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
			],
		}).compile();

		service = module.get(CommonToolValidationService);
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
			it('should pass when parameter has a default value', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withCustomParameters(1, {
						scope: CustomParameterScope.GLOBAL,
						default: 'defaultValue',
					})
					.build();

				const result: Promise<void> = service.validateCommon(externalToolDO);

				await expect(result).resolves.not.toThrow();
			});

			it('should throw an exception when defaultValue is empty', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withCustomParameters(1, {
						scope: CustomParameterScope.GLOBAL,
						default: undefined,
					})
					.build();

				const result: Promise<void> = service.validateCommon(externalToolDO);

				await expect(result).rejects.toThrow(
					new ValidationError(
						`tool_param_default_required: The "${
							(externalToolDO.parameters as CustomParameterDO[])[0].name
						}" is a global parameter and requires a default value.`
					)
				);
			});

			it('should throw an exception when the defaultValue is undefined', async () => {
				const externalToolDO: ExternalToolDO = externalToolDOFactory
					.withCustomParameters(1, {
						scope: CustomParameterScope.GLOBAL,
						default: '',
					})
					.build();

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
	});
});
