import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { userDoFactory } from '@shared/testing';
import { CustomParameterEntry } from '../../../common/domain';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	ToolContextType,
} from '../../../common/enum';
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
	AutoGroupExternalUuidStrategy,
	AutoMediumIdStrategy,
	AutoSchoolIdStrategy,
	AutoSchoolNumberStrategy,
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
		// should be implemented for further tests.. maybe use mapper for parameter to popertydata

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
	let autoGroupExternalUuidStrategy: DeepMocked<AutoGroupExternalUuidStrategy>;

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
					provide: AutoGroupExternalUuidStrategy,
					useValue: createMock<AutoGroupExternalUuidStrategy>(),
				},
			],
		}).compile();

		strategy = module.get(TestLaunchStrategy);

		autoSchoolIdStrategy = module.get(AutoSchoolIdStrategy);
		autoSchoolNumberStrategy = module.get(AutoSchoolNumberStrategy);
		autoContextIdStrategy = module.get(AutoContextIdStrategy);
		autoContextNameStrategy = module.get(AutoContextNameStrategy);
		autoMediumIdStrategy = module.get(AutoMediumIdStrategy);
		autoGroupExternalUuidStrategy = module.get(AutoGroupExternalUuidStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('createLaunchRequest', () => {
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
				const autoGroupExternalUuidCustomParameter = customParameterFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.QUERY,
					name: 'autoGroupExternalUuidParam',
					type: CustomParameterType.AUTO_GROUP_EXTERNALUUID,
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
						autoGroupExternalUuidCustomParameter,
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
				autoGroupExternalUuidStrategy.getValue.mockResolvedValueOnce(mockedAutoValue);

				return {
					globalCustomParameter,
					schoolCustomParameter,
					autoSchoolIdCustomParameter,
					autoSchoolNumberCustomParameter,
					autoContextIdCustomParameter,
					autoContextNameCustomParameter,
					autoMediumIdCustomParameter,
					autoGroupExternalUuidCustomParameter,
					schoolParameterEntry,
					contextParameterEntry,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					mockedAutoValue,
					sortFn,
				};
			};

			it('should return ToolLaunchRequest with merged parameters', async () => {
				const {
					globalCustomParameter,
					schoolCustomParameter,
					contextParameterEntry,
					autoSchoolIdCustomParameter,
					autoSchoolNumberCustomParameter,
					autoContextIdCustomParameter,
					autoContextNameCustomParameter,
					autoMediumIdCustomParameter,
					autoGroupExternalUuidCustomParameter,
					schoolParameterEntry,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					mockedAutoValue,
				} = setup();

				const result: ToolLaunchRequest = await strategy.createLaunchRequest('userId', {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				});

				expect(result).toEqual<ToolLaunchRequest>({
					url: externalTool.config.baseUrl,
					method: LaunchRequestMethod.GET,
					openNewTab: false,
					isDeepLink: false,
					payload: JSON.stringify([
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
							name: autoGroupExternalUuidCustomParameter.name,
							value: mockedAutoValue,
							location: PropertyLocation.QUERY,
						},
						{
							name: concreteConfigParameter.name,
							value: concreteConfigParameter.value,
							location: concreteConfigParameter.location,
						},
					]),
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

				const result: ToolLaunchRequest = await strategy.createLaunchRequest('userId', {
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
					strategy.createLaunchRequest('userId', {
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
					strategy.createLaunchRequest('userId', {
						externalTool,
						schoolExternalTool,
						contextExternalTool,
					});

				await expect(func).rejects.toThrow(ParameterTypeNotImplementedLoggableException);
			});
		});

		describe('when correct method, url and payload', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId({ id: userId });

				const pathParam = customParameterFactory.build({
					type: CustomParameterType.STRING,
					location: CustomParameterLocation.PATH,
					scope: CustomParameterScope.CONTEXT,
					name: 'pathParam',
				});

				const bodyParam = customParameterFactory.build({
					type: CustomParameterType.STRING,
					name: 'test',
					location: CustomParameterLocation.QUERY,
					scope: CustomParameterScope.CONTEXT,
				});

				const externalTool = externalToolFactory.buildWithId({ parameters: [pathParam, bodyParam] });

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({ toolId: externalTool.id });

				const contextExternalToolId = 'contextExternalToolId';
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					id: contextExternalToolId,
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.schoolId,
					},
					contextRef: {
						type: ToolContextType.COURSE,
					},
					parameters: [
						new CustomParameterEntry({ name: pathParam.name, value: 'searchValue' }),
						new CustomParameterEntry({ name: bodyParam.name, value: 'test' }),
					],
				});

				const data: ToolLaunchParams = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

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

				return {
					user,
					data,
					userId,
					propertyData1,
					propertyData2,
				};
			};

			it('should create a LaunchRequest', async () => {
				const { data, userId, propertyData1, propertyData2 } = setup();

				const result: ToolLaunchRequest = await strategy.createLaunchRequest(userId, data);

				expect(result).toEqual<ToolLaunchRequest>({
					method: LaunchRequestMethod.GET,
					url: `https://www.basic-baseurl.com/pre/${propertyData1.value}/post?${propertyData2.name}=${propertyData2.value}`,
					payload: expectedPayload,
					openNewTab: false,
					isDeepLink: false,
				});
			});
		});

		describe('when BODY properties are given', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId({ id: userId });

				const pathParam = customParameterFactory.build({
					type: CustomParameterType.STRING,
					location: CustomParameterLocation.PATH,
					scope: CustomParameterScope.CONTEXT,
					name: 'pathParam',
				});

				const bodyParam = customParameterFactory.build({
					name: 'test',
					type: CustomParameterType.STRING,
					location: CustomParameterLocation.QUERY,
					scope: CustomParameterScope.CONTEXT,
				});

				const externalTool = externalToolFactory.buildWithId({ parameters: [pathParam, bodyParam] });

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({ toolId: externalTool.id });

				const contextExternalToolId = 'contextExternalToolId';
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					id: contextExternalToolId,
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.schoolId,
					},
					contextRef: {
						type: ToolContextType.COURSE,
					},
					parameters: [
						new CustomParameterEntry({ name: pathParam.name, value: 'searchValue' }),
						new CustomParameterEntry({ name: bodyParam.name, value: 'value' }),
					],
				});

				const data: ToolLaunchParams = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

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

				const toolLaunchDataDO: ToolLaunchData = new ToolLaunchData({
					type: ToolLaunchDataType.BASIC,
					baseUrl: 'https://www.basic-baseurl.com/pre/:pathParam/post',
					properties: [],
					openNewTab: false,
				});

				toolLaunchDataDO.properties = [propertyData1, propertyData2];

				return {
					toolLaunchDataDO,
					user,
					data,
					userId,
					pathParam,
					bodyParam,
				};
			};

			it('should create a LaunchRequest', async () => {
				const { data, userId } = setup();

				const result: ToolLaunchRequest = await strategy.createLaunchRequest(userId, data);

				expect(result.payload).toEqual(expectedPayload);
			});
		});

		describe('when there are PATH and QUERY properties', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId({ id: userId });

				const pathParam = customParameterFactory.build({
					type: CustomParameterType.STRING,
					location: CustomParameterLocation.PATH,
					scope: CustomParameterScope.CONTEXT,
					name: 'pathParam',
				});

				const queryParam = customParameterFactory.build({
					type: CustomParameterType.STRING,
					location: CustomParameterLocation.QUERY,
					scope: CustomParameterScope.GLOBAL,
					name: 'queryParam',
					default: 'value',
				});

				const externalTool = externalToolFactory.buildWithId({ parameters: [pathParam, queryParam] });

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({ toolId: externalTool.id });

				const contextExternalToolId = 'contextExternalToolId';
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					id: contextExternalToolId,
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.schoolId,
					},
					contextRef: {
						type: ToolContextType.COURSE,
					},
					parameters: [new CustomParameterEntry({ name: pathParam.name, value: 'value' })],
				});

				const data: ToolLaunchParams = {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};

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

				return {
					user,
					data,
					userId,
					pathParam,
					pathProperty,
					queryProperty,
				};
			};

			it('should create a LaunchRequest', async () => {
				const { userId, data, pathProperty, queryProperty } = setup();

				const result: ToolLaunchRequest = await strategy.createLaunchRequest(userId, data);

				expect(result.url).toEqual(
					`https://www.basic-baseurl.com/pre/${pathProperty.value}/post?${queryProperty.name}=${queryProperty.value}`
				);
			});
		});
	});
});
