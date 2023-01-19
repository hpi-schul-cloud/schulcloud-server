import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/school-external-tool.factory';
import { CustomParameterDO, ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import {
	customParameterDOFactory,
	externalToolDOFactory,
} from '@shared/testing/factory/domainobject/external-tool.factory';
import { UnprocessableEntityException } from '@nestjs/common';
import { CustomParameterScope, CustomParameterType } from '@shared/domain';
import { ExternalToolService } from './external-tool.service';
import { SchoolExternalToolValidationService } from './school-external-tool-validation.service';

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
		schoolExternalToolDoMock?: Partial<SchoolExternalToolDO>
	) => {
		const schoolExternalToolDO: SchoolExternalToolDO = {
			...schoolExternalToolDOFactory.buildWithId(),
			...schoolExternalToolDoMock,
		};
		const externalToolDO: ExternalToolDO = { ...externalToolDOFactory.buildWithId(), ...externalToolDoMock };
		externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);
		return {
			schoolExternalToolDO,
			externalToolDO,
		};
	};

	describe('validateCreate is called', () => {
		describe('when schoolExternalTool is given', () => {
			it('should call externalToolService.findExternalToolById', async () => {
				const { schoolExternalToolDO } = setup();

				await service.validateCreate(schoolExternalToolDO);

				expect(externalToolService.findExternalToolById).toHaveBeenCalledWith(schoolExternalToolDO.toolId);
			});
		});
	});

	describe('checkVersionMatch is called', () => {
		describe('when version of externalTool and schoolExternalTool are equal', () => {
			it('should return without error', async () => {
				const { schoolExternalToolDO, externalToolDO } = setup({ version: 1337 }, { toolVersion: 1337 });

				const func = () => service.validateCreate(schoolExternalToolDO);

				await expect(func()).resolves.not.toThrowError(
					new UnprocessableEntityException(
						`The version ${schoolExternalToolDO.toolVersion} of given schoolExternalTool does not match the externalTool version ${externalToolDO.version}`
					)
				);
			});
		});

		describe('when externalTool and schoolExternalTool have different versions', () => {
			it('should throw error', async () => {
				const { schoolExternalToolDO, externalToolDO } = setup({ version: 8383 }, { toolVersion: 1337 });

				const func = () => service.validateCreate(schoolExternalToolDO);

				await expect(func()).rejects.toThrowError(
					new UnprocessableEntityException(
						`The version ${schoolExternalToolDO.toolVersion} of given schoolExternalTool does not match the externalTool version ${externalToolDO.version}.`
					)
				);
			});
		});
	});

	describe('checkForDuplicateParameters is called', () => {
		const expectedException: UnprocessableEntityException = new UnprocessableEntityException(
			'The given schoolExternalTool has one or more duplicates in its parameters.'
		);

		describe('when given parameters has duplicates', () => {
			it('should throw error', async () => {
				const { schoolExternalToolDO } = setup(undefined, {
					parameters: [
						{ name: 'nameDuplicate', value: 'value' },
						{ name: 'nameDuplicate', value: 'value' },
					],
				});

				const func = () => service.validateCreate(schoolExternalToolDO);

				await expect(func()).rejects.toThrowError(expectedException);
			});
		});

		describe('when given parameters has case insensitive duplicates', () => {
			it('should throw error', async () => {
				const { schoolExternalToolDO } = setup(undefined, {
					parameters: [
						{ name: 'nameDuplicate', value: 'value' },
						{ name: 'nameduplicate', value: 'value' },
					],
				});

				const func = () => service.validateCreate(schoolExternalToolDO);

				await expect(func()).rejects.toThrowError(expectedException);
			});
		});

		describe('when given parameters has no duplicates', () => {
			it('should return without error', async () => {
				const { schoolExternalToolDO } = setup(undefined, {
					parameters: [
						{ name: 'nameNoDuplicate1', value: 'value' },
						{ name: 'nameNoDuplicate2', value: 'value' },
					],
				});

				const func = () => service.validateCreate(schoolExternalToolDO);

				await expect(func()).resolves.not.toThrowError(expectedException);
			});
		});

		describe('checkCustomParameterEntries is called', () => {
			describe('externalToolDO has an parameter', () => {
				describe('with scope', () => {
					describe('school', () => {
						describe('which is required and is missing on schoolExternalToolDO params', () => {
							it('should throw exception', async () => {
								const missingParam: CustomParameterDO = customParameterDOFactory.build({
									name: 'isMissing',
									isOptional: false,
									scope: CustomParameterScope.SCHOOL,
								});
								const { schoolExternalToolDO } = setup(
									{
										parameters: [missingParam],
									},
									{
										parameters: [{ name: 'anotherParam', value: 'value' }],
									}
								);

								const func = () => service.validateCreate(schoolExternalToolDO);

								await expect(func()).rejects.toThrowError(
									`The parameter with name ${missingParam.name} is required but not found in the schoolExternalTool.`
								);
							});
						});

						describe('which is optional and is missing on schoolExternalToolDO params', () => {
							it('should return without error', async () => {
								const { schoolExternalToolDO } = setup(
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

								const func = () => service.validateCreate(schoolExternalToolDO);

								await expect(func()).resolves.not.toThrowError(
									`The parameter with name anotherParam is required but not found in the schoolExternalTool.`
								);
							});
						});
					});

					describe('with another scope than school', () => {
						it('should return without any error', async () => {
							const notSchoolParam: CustomParameterDO = customParameterDOFactory.build({
								name: 'notSchoolParam',
								scope: CustomParameterScope.GLOBAL,
								type: CustomParameterType.BOOLEAN,
							});
							const { schoolExternalToolDO } = setup(
								{
									parameters: [notSchoolParam],
								},
								{
									parameters: [{ name: 'name', value: 'true' }],
								}
							);

							const func = () => service.validateCreate(schoolExternalToolDO);

							await expect(func()).resolves.not.toThrowError();
						});
					});
				});

				describe('with type', () => {
					describe('string', () => {
						describe('which matches the schoolExternalToolDO param value', () => {
							it('should return without error', async () => {
								const correctTypeParam: CustomParameterDO = customParameterDOFactory.build({
									name: 'correctType',
									scope: CustomParameterScope.SCHOOL,
									type: CustomParameterType.STRING,
								});
								const { schoolExternalToolDO } = setup(
									{
										parameters: [correctTypeParam],
									},
									{
										parameters: [{ name: correctTypeParam.name, value: 'dasIstEinString' }],
									}
								);

								const func = () => service.validateCreate(schoolExternalToolDO);

								await expect(func()).resolves.not.toThrowError(
									`The value of parameter with name ${correctTypeParam.name} should be of type ${correctTypeParam.type}.`
								);
							});
						});
					});

					describe('number', () => {
						describe('which matches the schoolExternalToolDO param value', () => {
							it('should return without error', async () => {
								const correctTypeParam: CustomParameterDO = customParameterDOFactory.build({
									name: 'correctType',
									scope: CustomParameterScope.SCHOOL,
									type: CustomParameterType.NUMBER,
								});
								const { schoolExternalToolDO } = setup(
									{
										parameters: [correctTypeParam],
									},
									{
										parameters: [{ name: correctTypeParam.name, value: '1234' }],
									}
								);

								const func = () => service.validateCreate(schoolExternalToolDO);

								await expect(func()).resolves.not.toThrowError(
									`The value of parameter with name ${correctTypeParam.name} should be of type ${correctTypeParam.type}.`
								);
							});
						});

						describe('which not matches schoolExternalToolDO param value', () => {
							it('should throw exception', async () => {
								const wrongTypeParam: CustomParameterDO = customParameterDOFactory.build({
									name: 'wrongType',
									scope: CustomParameterScope.SCHOOL,
									type: CustomParameterType.NUMBER,
								});
								const { schoolExternalToolDO } = setup(
									{
										parameters: [wrongTypeParam],
									},
									{
										parameters: [{ name: wrongTypeParam.name, value: '17271hsadas' }],
									}
								);

								const func = () => service.validateCreate(schoolExternalToolDO);

								await expect(func()).rejects.toThrowError(
									`The value of parameter with name ${wrongTypeParam.name} should be of type ${wrongTypeParam.type}.`
								);
							});
						});
					});

					describe('boolean', () => {
						describe('which matches the schoolExternalToolDO param value', () => {
							it('should return without error', async () => {
								const correctTypeParam: CustomParameterDO = customParameterDOFactory.build({
									name: 'correctType',
									scope: CustomParameterScope.SCHOOL,
									type: CustomParameterType.BOOLEAN,
								});
								const { schoolExternalToolDO } = setup(
									{
										parameters: [correctTypeParam],
									},
									{
										parameters: [{ name: correctTypeParam.name, value: 'true' }],
									}
								);

								const func = () => service.validateCreate(schoolExternalToolDO);

								await expect(func()).resolves.not.toThrowError(
									`The value of parameter with name ${correctTypeParam.name} should be of type ${correctTypeParam.type}.`
								);
							});
						});

						describe('which not matches schoolExternalToolDO param value', () => {
							it('should throw exception', async () => {
								const wrongTypeParam: CustomParameterDO = customParameterDOFactory.build({
									name: 'wrongType',
									scope: CustomParameterScope.SCHOOL,
									type: CustomParameterType.BOOLEAN,
								});
								const { schoolExternalToolDO } = setup(
									{
										parameters: [wrongTypeParam],
									},
									{
										parameters: [{ name: wrongTypeParam.name, value: '17271hsadas' }],
									}
								);

								const func = () => service.validateCreate(schoolExternalToolDO);

								await expect(func()).rejects.toThrowError(
									`The value of parameter with name ${wrongTypeParam.name} should be of type ${wrongTypeParam.type}.`
								);
							});
						});
					});

					describe('auto_courseId', () => {
						describe('which matches the schoolExternalToolDO param value', () => {
							it('should return without error', async () => {
								const correctTypeParam: CustomParameterDO = customParameterDOFactory.build({
									name: 'correctType',
									scope: CustomParameterScope.SCHOOL,
									type: CustomParameterType.AUTO_COURSEID,
								});
								const { schoolExternalToolDO } = setup(
									{
										parameters: [correctTypeParam],
									},
									{
										parameters: [{ name: 'correctType', value: 'irgendeineId123' }],
									}
								);

								const func = () => service.validateCreate(schoolExternalToolDO);

								await expect(func()).resolves.not.toThrowError(
									`The value of parameter with name ${correctTypeParam.name} should be of type ${correctTypeParam.type}.`
								);
							});
						});
					});

					describe('auto_courseName', () => {
						describe('which matches the schoolExternalToolDO param value', () => {
							it('should return without error', async () => {
								const correctTypeParam: CustomParameterDO = customParameterDOFactory.build({
									name: 'correctType',
									scope: CustomParameterScope.SCHOOL,
									type: CustomParameterType.AUTO_COURSENAME,
								});
								const { schoolExternalToolDO } = setup(
									{
										parameters: [correctTypeParam],
									},
									{
										parameters: [{ name: 'correctType', value: 'irgendeineId123' }],
									}
								);

								const func = () => service.validateCreate(schoolExternalToolDO);

								await expect(func()).resolves.not.toThrowError(
									`The value of parameter with name ${correctTypeParam.name} should be of type ${correctTypeParam.type}.`
								);
							});
						});
					});

					describe('auto_schoolId', () => {
						describe('which matches the schoolExternalToolDO param value', () => {
							it('should return without error', async () => {
								const correctTypeParam: CustomParameterDO = customParameterDOFactory.build({
									name: 'correctType',
									scope: CustomParameterScope.SCHOOL,
									type: CustomParameterType.AUTO_SCHOOLID,
								});
								const { schoolExternalToolDO } = setup(
									{
										parameters: [correctTypeParam],
									},
									{
										parameters: [{ name: 'correctType', value: 'irgendeineId123' }],
									}
								);

								const func = () => service.validateCreate(schoolExternalToolDO);

								await expect(func()).resolves.not.toThrowError(
									`The value of parameter with name ${correctTypeParam.name} should be of type ${correctTypeParam.type}.`
								);
							});
						});
					});
				});

				describe('with type string and regex', () => {
					describe('param value fit the regex', () => {
						it('should return without error', async () => {
							const validRegex: CustomParameterDO = customParameterDOFactory.build({
								name: 'validRegex',
								scope: CustomParameterScope.SCHOOL,
								type: CustomParameterType.STRING,
								regex: '[x]',
							});
							const { schoolExternalToolDO } = setup(
								{
									parameters: [validRegex],
								},
								{
									parameters: [{ name: 'validRegex', value: 'xxxx' }],
								}
							);

							const func = () => service.validateCreate(schoolExternalToolDO);

							await expect(func()).resolves.not.toThrowError(
								`The given entry for the parameter with name ${validRegex.name} does not fit the regex.`
							);
						});
					});

					describe('param value does not fit the regex', () => {
						it('should throw exception', async () => {
							const validRegex: CustomParameterDO = customParameterDOFactory.build({
								name: 'validRegex',
								scope: CustomParameterScope.SCHOOL,
								type: CustomParameterType.STRING,
								regex: '[x]',
							});
							const { schoolExternalToolDO } = setup(
								{
									parameters: [validRegex],
								},
								{
									parameters: [{ name: 'validRegex', value: 'abcdefasdhasd' }],
								}
							);

							const func = () => service.validateCreate(schoolExternalToolDO);

							await expect(func()).rejects.toThrowError(
								`The given entry for the parameter with name ${validRegex.name} does not fit the regex.`
							);
						});
					});
				});
			});
		});
	});
});
