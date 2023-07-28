import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import {
	customParameterDOFactory,
	externalToolDOFactory,
	schoolExternalToolDOFactory,
} from '@shared/testing/factory/domainobject/tool';
import { ExternalToolDO } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalToolValidationService } from './school-external-tool-validation.service';
import { SchoolExternalTool } from '../domain';
import { CustomParameterDO } from '../../common/domain';
import { CustomParameterScope, CustomParameterType } from '../../common/enum';

describe('SchoolExternalToolValidationService', () => {
	let module: TestingModule;
	let service: SchoolExternalToolValidationService;

	let externalToolService: DeepMocked<ExternalToolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolExternalToolValidationService,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
			],
		}).compile();

		service = module.get(SchoolExternalToolValidationService);
		externalToolService = module.get(ExternalToolService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	const setup = (
		externalToolDoMock?: Partial<ExternalToolDO>,
		schoolExternalToolDoMock?: Partial<SchoolExternalTool>
	) => {
		const schoolExternalTool: SchoolExternalTool = schoolExternalToolDOFactory.build({
			...schoolExternalToolDOFactory.buildWithId(),
			...schoolExternalToolDoMock,
		});
		const externalToolDO: ExternalToolDO = new ExternalToolDO({
			...externalToolDOFactory.buildWithId(),
			...externalToolDoMock,
		});
		externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);
		const schoolExternalToolId = schoolExternalTool.id as string;
		return {
			schoolExternalTool,
			externalToolDO,
			schoolExternalToolId,
		};
	};

	describe('validate is called', () => {
		describe('when schoolExternalTool is given', () => {
			it('should call externalToolService.findExternalToolById', async () => {
				const { schoolExternalTool } = setup();

				await service.validate(schoolExternalTool);

				expect(externalToolService.findExternalToolById).toHaveBeenCalledWith(schoolExternalTool.toolId);
			});
		});

		describe('when version of externalTool and schoolExternalTool are different', () => {
			it('should throw error', async () => {
				const { schoolExternalTool } = setup({ version: 8383 }, { toolVersion: 1337 });

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).rejects.toThrowError('tool_version_mismatch:');
			});
		});

		describe('when checking parameter is required', () => {
			it('should throw error when given parameter is not optional and parameter value is empty', async () => {
				const requiredParam: CustomParameterDO = customParameterDOFactory.build({
					name: 'requiredParam',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.STRING,
					isOptional: false,
				});
				const { schoolExternalTool } = setup(
					{
						parameters: [requiredParam],
					},
					{
						parameters: [{ name: 'requiredParam', value: '' }],
					}
				);

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).rejects.toThrowError('tool_param_required:');
			});
		});

		describe('when checking parameters for duplicates', () => {
			it('should throw error when given parameters has a case sensitive duplicate', async () => {
				const { schoolExternalTool } = setup(undefined, {
					parameters: [
						{ name: 'nameDuplicate', value: 'value' },
						{ name: 'nameDuplicate', value: 'value' },
					],
				});

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).rejects.toThrowError('tool_param_duplicate:');
			});

			it('should throw error when given parameters has case insensitive duplicate', async () => {
				const { schoolExternalTool } = setup(undefined, {
					parameters: [
						{ name: 'nameDuplicate', value: 'value' },
						{ name: 'nameduplicate', value: 'value' },
					],
				});

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).rejects.toThrowError('tool_param_duplicate:');
			});

			it('when given parameters has no duplicates should return without error', async () => {
				const { schoolExternalTool } = setup(undefined, {
					parameters: [
						{ name: 'nameNoDuplicate1', value: 'value' },
						{ name: 'nameNoDuplicate2', value: 'value' },
					],
				});

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).resolves.not.toThrowError('tool_param_duplicate:');
			});
		});

		describe('when parameter scope is not school', () => {
			it('should return without any error', async () => {
				const notSchoolParam: CustomParameterDO = customParameterDOFactory.build({
					name: 'notSchoolParam',
					scope: CustomParameterScope.GLOBAL,
					type: CustomParameterType.BOOLEAN,
				});
				const { schoolExternalTool } = setup(
					{
						parameters: [notSchoolParam],
					},
					{
						parameters: [{ name: 'name', value: 'true' }],
					}
				);

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).resolves.not.toThrowError();
			});
		});

		describe('when parameter scope is school', () => {
			it('should throw exception when required parameter is missing', async () => {
				const missingParam: CustomParameterDO = customParameterDOFactory.build({
					name: 'isMissing',
					isOptional: false,
					scope: CustomParameterScope.SCHOOL,
				});
				const { schoolExternalTool } = setup(
					{
						parameters: [missingParam],
					},
					{
						parameters: [{ name: 'anotherParam', value: 'value' }],
					}
				);

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).rejects.toThrowError('tool_param_required:');
			});

			it('should return without error when parameter is optional but is missing on params', async () => {
				const { schoolExternalTool } = setup(
					{
						parameters: [
							customParameterDOFactory.build({
								name: 'notChecked',
								scope: CustomParameterScope.SCHOOL,
								isOptional: true,
							}),
						],
					},
					{
						parameters: [{ name: 'anotherParam', value: 'value' }],
					}
				);

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).resolves.not.toThrowError('tool_param_required:');
			});
		});

		describe('when checking parameter type string', () => {
			it('should return without error', async () => {
				const correctTypeParam: CustomParameterDO = customParameterDOFactory.build({
					name: 'correctType',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.STRING,
				});
				const { schoolExternalTool } = setup(
					{
						parameters: [correctTypeParam],
					},
					{
						parameters: [{ name: correctTypeParam.name, value: 'dasIstEinString' }],
					}
				);

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).resolves.not.toThrowError('tool_param_type_mismatch:');
			});
		});

		describe('when checking parameter type number', () => {
			it('should return without error when type matches param value', async () => {
				const correctTypeParam: CustomParameterDO = customParameterDOFactory.build({
					name: 'correctType',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.NUMBER,
				});
				const { schoolExternalTool } = setup(
					{
						parameters: [correctTypeParam],
					},
					{
						parameters: [{ name: correctTypeParam.name, value: '1234' }],
					}
				);

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).resolves.not.toThrowError('tool_param_type_mismatch:');
			});

			it('should throw exception when type not matches param value', async () => {
				const wrongTypeParam: CustomParameterDO = customParameterDOFactory.build({
					name: 'wrongType',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.NUMBER,
				});
				const { schoolExternalTool } = setup(
					{
						parameters: [wrongTypeParam],
					},
					{
						parameters: [{ name: wrongTypeParam.name, value: '17271hsadas' }],
					}
				);

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).rejects.toThrowError('tool_param_type_mismatch:');
			});
		});

		describe('when checking parameter type boolean', () => {
			it('should return without error when type matches param value', async () => {
				const correctTypeParam: CustomParameterDO = customParameterDOFactory.build({
					name: 'correctType',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.BOOLEAN,
				});
				const { schoolExternalTool } = setup(
					{
						parameters: [correctTypeParam],
					},
					{
						parameters: [{ name: correctTypeParam.name, value: 'true' }],
					}
				);

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).resolves.not.toThrowError('tool_param_type_mismatch:');
			});

			it('should throw exception when type not matches param value', async () => {
				const wrongTypeParam: CustomParameterDO = customParameterDOFactory.build({
					name: 'wrongType',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.BOOLEAN,
					isOptional: true,
				});
				const { schoolExternalTool } = setup(
					{
						parameters: [wrongTypeParam],
					},
					{
						parameters: [{ name: wrongTypeParam.name, value: '' }],
					}
				);

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).rejects.toThrowError('tool_param_type_mismatch:');
			});
		});

		describe('when checking parameter type auto_contextId', () => {
			it('should return without error when type matches param value', async () => {
				const correctTypeParam: CustomParameterDO = customParameterDOFactory.build({
					name: 'correctType',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.AUTO_CONTEXTID,
				});
				const { schoolExternalTool } = setup(
					{
						parameters: [correctTypeParam],
					},
					{
						parameters: [{ name: 'correctType', value: 'irgendeineId123' }],
					}
				);

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).resolves.not.toThrowError('tool_param_type_mismatch:');
			});
		});

		describe('when checking parameter type auto_contextName', () => {
			it('should return without error when type matches param value', async () => {
				const correctTypeParam: CustomParameterDO = customParameterDOFactory.build({
					name: 'correctType',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.AUTO_CONTEXTNAME,
				});
				const { schoolExternalTool } = setup(
					{
						parameters: [correctTypeParam],
					},
					{
						parameters: [{ name: 'correctType', value: 'irgendeineId123' }],
					}
				);

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).resolves.not.toThrowError('tool_param_type_mismatch:');
			});
		});

		describe('when checking parameter type auto_schoolId', () => {
			it('should return without error when type matches param value', async () => {
				const correctTypeParam: CustomParameterDO = customParameterDOFactory.build({
					name: 'correctType',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.AUTO_SCHOOLID,
				});
				const { schoolExternalTool } = setup(
					{
						parameters: [correctTypeParam],
					},
					{
						parameters: [{ name: 'correctType', value: 'irgendeineId123' }],
					}
				);

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).resolves.not.toThrowError('tool_param_type_mismatch:');
			});
		});

		describe('when checking parameter type auto_schoolnumber', () => {
			it('should return without error when type matches param value', async () => {
				const correctTypeParam: CustomParameterDO = customParameterDOFactory.build({
					name: 'correctType',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.AUTO_SCHOOLNUMBER,
				});
				const { schoolExternalTool } = setup(
					{
						parameters: [correctTypeParam],
					},
					{
						parameters: [{ name: 'correctType', value: 'irgendeineId123' }],
					}
				);

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).resolves.not.toThrowError('tool_param_type_mismatch:');
			});
		});

		describe('when validating regex', () => {
			it('should skip validation when no regex is given', async () => {
				const undefinedRegex: CustomParameterDO = customParameterDOFactory.build({
					name: 'undefinedRegex',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.STRING,
					regex: undefined,
				});
				const { schoolExternalTool } = setup(
					{
						parameters: [undefinedRegex],
					},
					{
						parameters: [{ name: 'undefinedRegex', value: 'xxxx' }],
					}
				);

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).resolves.not.toThrowError(`tool_param_value_regex`);
			});

			it('should return without error when param value is valid', async () => {
				const validRegex: CustomParameterDO = customParameterDOFactory.build({
					name: 'validRegex',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.STRING,
					regex: '[x]',
				});
				const { schoolExternalTool } = setup(
					{
						parameters: [validRegex],
					},
					{
						parameters: [{ name: 'validRegex', value: 'xxxx' }],
					}
				);

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).resolves.not.toThrowError('tool_param_value_regex:');
			});

			it('should throw exception when param value is not valid', async () => {
				const validRegex: CustomParameterDO = customParameterDOFactory.build({
					name: 'validRegex',
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.STRING,
					regex: '[x]',
				});
				const { schoolExternalTool } = setup(
					{
						parameters: [validRegex],
					},
					{
						parameters: [{ name: 'validRegex', value: 'abcdefasdhasd' }],
					}
				);

				const func = () => service.validate(schoolExternalTool);

				await expect(func()).rejects.toThrowError('tool_param_value_regex:');
			});
		});
	});
});
