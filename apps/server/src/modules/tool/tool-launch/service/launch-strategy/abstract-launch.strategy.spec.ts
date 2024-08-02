import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
import { CustomParameterEntry } from '../../../common/domain';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '../../../common/enum';
import { ContextExternalTool } from '../../../context-external-tool/domain';
import { contextExternalToolFactory } from '../../../context-external-tool/testing';
import { ExternalTool } from '../../../external-tool/domain';
import { customParameterFactory, externalToolFactory } from '../../../external-tool/testing';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { schoolExternalToolFactory } from '../../../school-external-tool/testing';
import { MissingToolParameterValueLoggableException, ParameterTypeNotImplementedLoggableException } from '../../error';
import {
	LaunchRequestMethod,
	PropertyData,
	PropertyLocation,
	ToolLaunchData,
	ToolLaunchDataType,
	ToolLaunchRequest,
} from '../../types';
import {
	AutoContextIdStrategy,
	AutoContextNameStrategy,
	AutoMediumIdStrategy,
	AutoSchoolIdStrategy,
	AutoSchoolNumberStrategy,
	AutoGroupUuidStrategy,
} from '../auto-parameter-strategy';
import { AbstractLaunchStrategy } from './abstract-launch.strategy';
import { ToolLaunchParams } from './tool-launch-params.interface';

const concreteConfigParameter: PropertyData = {
	location: PropertyLocation.QUERY,
	name: 'concreteParam',
	value: 'test',
};

const expectedPayload = 'payload';

const launchMethod = LaunchRequestMethod.GET;

@Injectable()
class TestLaunchStrategy extends AbstractLaunchStrategy {
	public override buildToolLaunchDataFromConcreteConfig(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		userId: EntityId,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		config: ToolLaunchParams
	): Promise<PropertyData[]> {
		// Implement this method with your own logic for the mock launch strategy
		return Promise.resolve([concreteConfigParameter]);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public buildToolLaunchRequestPayload(url: string, properties: PropertyData[]): string {
		return expectedPayload;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public override determineLaunchRequestMethod(properties: PropertyData[]): LaunchRequestMethod {
		return launchMethod;
	}
}

describe(AbstractLaunchStrategy.name, () => {
	let module: TestingModule;
	let strategy: TestLaunchStrategy;

	let autoSchoolIdStrategy: DeepMocked<AutoSchoolIdStrategy>;
	let autoSchoolNumberStrategy: DeepMocked<AutoSchoolNumberStrategy>;
	let autoContextIdStrategy: DeepMocked<AutoContextIdStrategy>;
	let autoContextNameStrategy: DeepMocked<AutoContextNameStrategy>;
	let autoMediumIdStrategy: DeepMocked<AutoMediumIdStrategy>;
	let autoGroupUuidStrategy: DeepMocked<AutoGroupUuidStrategy>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TestLaunchStrategy,
				{
					provide: AutoSchoolIdStrategy,
					useValue: createMock<AutoSchoolIdStrategy>(),
				},
				{
					provide: AutoSchoolNumberStrategy,
					useValue: createMock<AutoSchoolNumberStrategy>(),
				},
				{
					provide: AutoContextIdStrategy,
					useValue: createMock<AutoContextIdStrategy>(),
				},
				{
					provide: AutoContextNameStrategy,
					useValue: createMock<AutoContextNameStrategy>(),
				},
				{
					provide: AutoMediumIdStrategy,
					useValue: createMock<AutoMediumIdStrategy>(),
				},
				{
					provide: AutoGroupUuidStrategy,
					useValue: createMock<AutoGroupUuidStrategy>(),
				},
			],
		}).compile();

		strategy = module.get(TestLaunchStrategy);

		autoSchoolIdStrategy = module.get(AutoSchoolIdStrategy);
		autoSchoolNumberStrategy = module.get(AutoSchoolNumberStrategy);
		autoContextIdStrategy = module.get(AutoContextIdStrategy);
		autoContextNameStrategy = module.get(AutoContextNameStrategy);
		autoMediumIdStrategy = module.get(AutoMediumIdStrategy);
		autoGroupUuidStrategy = module.get(AutoGroupUuidStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('createLaunchData', () => {
		describe('when parameters of every type are defined', () => {
			const setup = () => {
				const schoolId: string = new ObjectId().toHexString();
				const mockedAutoValue = 'mockedAutoValue';

				// External Tool
				const globalCustomParameter = customParameterFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.PATH,
					default: 'value',
					name: 'globalParam',
					type: CustomParameterType.STRING,
				});
				const schoolCustomParameter = customParameterFactory.build({
					scope: CustomParameterScope.SCHOOL,
					location: CustomParameterLocation.BODY,
					name: 'schoolParam',
					type: CustomParameterType.BOOLEAN,
				});
				const contextCustomParameter = customParameterFactory.build({
					scope: CustomParameterScope.CONTEXT,
					location: CustomParameterLocation.QUERY,
					name: 'contextParam',
					type: CustomParameterType.NUMBER,
				});
				const autoSchoolIdCustomParameter = customParameterFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.BODY,
					name: 'autoSchoolIdParam',
					type: CustomParameterType.AUTO_SCHOOLID,
				});
				const autoSchoolNumberCustomParameter = customParameterFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.BODY,
					name: 'autoSchoolNumberParam',
					type: CustomParameterType.AUTO_SCHOOLNUMBER,
				});
				const autoContextIdCustomParameter = customParameterFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.BODY,
					name: 'autoContextIdParam',
					type: CustomParameterType.AUTO_CONTEXTID,
				});
				const autoContextNameCustomParameter = customParameterFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.BODY,
					name: 'autoContextNameParam',
					type: CustomParameterType.AUTO_CONTEXTNAME,
				});
				const autoMediumIdCustomParameter = customParameterFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.QUERY,
					name: 'autoMediumIdParam',
					type: CustomParameterType.AUTO_MEDIUMID,
				});
				const autoGroupUuidCustomParameter = customParameterFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.QUERY,
					name: 'autoGroupUuidParam',
					type: CustomParameterType.AUTO_GROUPUUID,
				});

				const externalTool: ExternalTool = externalToolFactory.build({
					parameters: [
						globalCustomParameter,
						schoolCustomParameter,
						contextCustomParameter,
						autoSchoolIdCustomParameter,
						autoSchoolNumberCustomParameter,
						autoContextIdCustomParameter,
						autoContextNameCustomParameter,
						autoMediumIdCustomParameter,
						autoGroupUuidCustomParameter,
					],
				});

				// School External Tool
				const schoolParameterEntry: CustomParameterEntry = new CustomParameterEntry({
					name: schoolCustomParameter.name,
					value: 'true',
				});
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					parameters: [schoolParameterEntry],
					schoolId,
				});

				// Context External Tool
				const contextParameterEntry: CustomParameterEntry = new CustomParameterEntry({
					name: contextCustomParameter.name,
					value: 'anyValue2',
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					parameters: [contextParameterEntry],
				});

				const sortFn = (a: PropertyData, b: PropertyData) => {
					if (a.name < b.name) {
						return -1;
					}
					if (a.name > b.name) {
						return 1;
					}
					return 0;
				};

				autoSchoolIdStrategy.getValue.mockReturnValueOnce(mockedAutoValue);
				autoSchoolNumberStrategy.getValue.mockResolvedValueOnce(mockedAutoValue);
				autoContextIdStrategy.getValue.mockReturnValueOnce(mockedAutoValue);
				autoContextNameStrategy.getValue.mockResolvedValueOnce(mockedAutoValue);
				autoMediumIdStrategy.getValue.mockResolvedValueOnce(mockedAutoValue);
				autoGroupUuidStrategy.getValue.mockResolvedValueOnce(mockedAutoValue);

				return {
					globalCustomParameter,
					schoolCustomParameter,
					autoSchoolIdCustomParameter,
					autoSchoolNumberCustomParameter,
					autoContextIdCustomParameter,
					autoContextNameCustomParameter,
					autoMediumIdCustomParameter,
					autoGroupUuidCustomParameter,
					schoolParameterEntry,
					contextParameterEntry,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					mockedAutoValue,
					sortFn,
				};
			};

			it('should return ToolLaunchData with merged parameters', async () => {
				const {
					globalCustomParameter,
					schoolCustomParameter,
					contextParameterEntry,
					autoSchoolIdCustomParameter,
					autoSchoolNumberCustomParameter,
					autoContextIdCustomParameter,
					autoContextNameCustomParameter,
					autoMediumIdCustomParameter,
					autoGroupUuidCustomParameter,
					schoolParameterEntry,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					mockedAutoValue,
					sortFn,
				} = setup();

				const result: ToolLaunchData = await strategy.createLaunchData('userId', {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				});

				result.properties = result.properties.sort(sortFn);
				expect(result).toEqual<ToolLaunchData>({
					baseUrl: externalTool.config.baseUrl,
					type: ToolLaunchDataType.BASIC,
					openNewTab: false,
					properties: [
						{
							name: globalCustomParameter.name,
							value: globalCustomParameter.default as string,
							location: PropertyLocation.PATH,
						},
						{
							name: schoolCustomParameter.name,
							value: schoolParameterEntry.value as string,
							location: PropertyLocation.BODY,
						},
						{
							name: contextParameterEntry.name,
							value: contextParameterEntry.value as string,
							location: PropertyLocation.QUERY,
						},
						{
							name: autoSchoolIdCustomParameter.name,
							value: mockedAutoValue,
							location: PropertyLocation.BODY,
						},
						{
							name: autoSchoolNumberCustomParameter.name,
							value: mockedAutoValue,
							location: PropertyLocation.BODY,
						},
						{
							name: autoContextIdCustomParameter.name,
							value: mockedAutoValue,
							location: PropertyLocation.BODY,
						},
						{
							name: autoContextNameCustomParameter.name,
							value: mockedAutoValue,
							location: PropertyLocation.BODY,
						},
						{
							name: autoMediumIdCustomParameter.name,
							value: mockedAutoValue,
							location: PropertyLocation.QUERY,
						},
						{
							name: autoGroupUuidCustomParameter.name,
							value: mockedAutoValue,
							location: PropertyLocation.QUERY,
						},
						{
							name: concreteConfigParameter.name,
							value: concreteConfigParameter.value,
							location: concreteConfigParameter.location,
						},
					].sort(sortFn),
				});
			});
		});

		describe('when no parameters were defined', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build({
					parameters: [],
				});

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					parameters: [],
				});

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					parameters: [],
				});

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return a ToolLaunchData with no custom parameters', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const result: ToolLaunchData = await strategy.createLaunchData('userId', {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				});

				expect(result).toEqual<ToolLaunchData>({
					baseUrl: externalTool.config.baseUrl,
					type: ToolLaunchDataType.BASIC,
					openNewTab: false,
					properties: [
						{
							name: concreteConfigParameter.name,
							value: concreteConfigParameter.value,
							location: concreteConfigParameter.location,
						},
					],
				});
			});
		});

		describe('when a parameter has no value, but is required', () => {
			const setup = () => {
				const autoSchoolNumberCustomParameter = customParameterFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.BODY,
					name: 'autoSchoolNumberParam',
					type: CustomParameterType.AUTO_SCHOOLNUMBER,
				});
				const externalTool: ExternalTool = externalToolFactory.build({
					parameters: [autoSchoolNumberCustomParameter],
				});

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					parameters: [],
				});

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					parameters: [],
				});

				autoSchoolNumberStrategy.getValue.mockResolvedValue(undefined);

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should throw a MissingToolParameterValueLoggableException', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const func = async () =>
					strategy.createLaunchData('userId', {
						externalTool,
						schoolExternalTool,
						contextExternalTool,
					});

				await expect(func).rejects.toThrow(MissingToolParameterValueLoggableException);
			});
		});

		describe('when a parameter type is not implemented ', () => {
			const setup = () => {
				const customParameterWithUnknownType = customParameterFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.BODY,
					name: 'unknownTypeParam',
					type: 'unknownType' as unknown as CustomParameterType,
				});
				const externalTool: ExternalTool = externalToolFactory.build({
					parameters: [customParameterWithUnknownType],
				});

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					parameters: [],
				});

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					parameters: [],
				});

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should throw a ParameterNotImplementedLoggableException', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool } = setup();

				const func = async () =>
					strategy.createLaunchData('userId', {
						externalTool,
						schoolExternalTool,
						contextExternalTool,
					});

				await expect(func).rejects.toThrow(ParameterTypeNotImplementedLoggableException);
			});
		});
	});

	describe('createLaunchRequest', () => {
		const setup = () => {
			const toolLaunchDataDO: ToolLaunchData = new ToolLaunchData({
				type: ToolLaunchDataType.BASIC,
				baseUrl: 'https://www.basic-baseurl.com/pre/:pathParam/post',
				properties: [],
				openNewTab: false,
			});

			return {
				toolLaunchDataDO,
			};
		};

		it('should create a LaunchRequest with the correct method, url and payload', () => {
			const { toolLaunchDataDO } = setup();

			const propertyData1 = new PropertyData({
				name: 'pathParam',
				value: 'searchValue',
				location: PropertyLocation.PATH,
			});
			const propertyData2 = new PropertyData({
				name: 'test',
				value: 'test',
				location: PropertyLocation.QUERY,
			});
			toolLaunchDataDO.properties = [propertyData1, propertyData2];

			const result: ToolLaunchRequest = strategy.createLaunchRequest(toolLaunchDataDO);

			expect(result).toEqual<ToolLaunchRequest>({
				method: LaunchRequestMethod.GET,
				url: `https://www.basic-baseurl.com/pre/${propertyData1.value}/post?${propertyData2.name}=${propertyData2.value}`,
				payload: expectedPayload,
				openNewTab: toolLaunchDataDO.openNewTab,
			});
		});

		it('should create a LaunchRequest with the correct payload when there are BODY properties', () => {
			const { toolLaunchDataDO } = setup();

			const bodyProperty1 = new PropertyData({
				name: 'key1',
				value: 'value1',
				location: PropertyLocation.BODY,
			});
			const bodyProperty2 = new PropertyData({
				name: 'key2',
				value: 'value2',
				location: PropertyLocation.BODY,
			});
			toolLaunchDataDO.properties = [bodyProperty1, bodyProperty2];

			const result: ToolLaunchRequest = strategy.createLaunchRequest(toolLaunchDataDO);

			expect(result.payload).toEqual(expectedPayload);
		});

		it('should create a LaunchRequest with the correct url when there are PATH and QUERY properties', () => {
			const { toolLaunchDataDO } = setup();

			const pathProperty = new PropertyData({
				name: 'pathParam',
				value: 'segmentValue',
				location: PropertyLocation.PATH,
			});
			const queryProperty = new PropertyData({
				name: 'queryParam',
				value: 'queryValue',
				location: PropertyLocation.QUERY,
			});
			toolLaunchDataDO.properties = [pathProperty, queryProperty];

			const result: ToolLaunchRequest = strategy.createLaunchRequest(toolLaunchDataDO);

			expect(result.url).toEqual(
				`https://www.basic-baseurl.com/pre/${pathProperty.value}/post?${queryProperty.name}=${queryProperty.value}`
			);
		});
	});
});
