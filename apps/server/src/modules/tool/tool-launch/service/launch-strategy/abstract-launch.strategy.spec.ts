import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
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
import { LaunchRequestMethod, LaunchType, PropertyData, PropertyLocation, ToolLaunchRequest } from '../../types';
import {
	AutoContextIdStrategy,
	AutoContextNameStrategy,
	AutoGroupExternalUuidStrategy,
	AutoMediumIdStrategy,
	AutoPublisherStrategy,
	AutoSchoolIdStrategy,
	AutoSchoolNumberStrategy,
} from '../auto-parameter-strategy';
import { AbstractLaunchStrategy } from './abstract-launch.strategy';
import { ToolLaunchParams } from './tool-launch-params.interface';

const concreteConfigParameter: PropertyData = {
	name: 'concreteParam',
	value: 'test',
	location: PropertyLocation.BODY,
};

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
		return JSON.stringify(properties);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public override determineLaunchRequestMethod(properties: PropertyData[]): LaunchRequestMethod {
		return launchMethod;
	}

	determineLaunchType(): LaunchType {
		return LaunchType.BASIC;
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
	let autoPublisherStrategy: DeepMocked<AutoPublisherStrategy>;
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
					provide: AutoPublisherStrategy,
					useValue: createMock<AutoPublisherStrategy>(),
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
		autoPublisherStrategy = module.get(AutoPublisherStrategy);
		autoGroupExternalUuidStrategy = module.get(AutoGroupExternalUuidStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('createLaunchRequest', () => {
		describe('when parameters of every type are defined', () => {
			const setup = () => {
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
				const autoPublisherCustomParameter = customParameterFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.BODY,
					name: 'autoPublisherParam',
					type: CustomParameterType.AUTO_PUBLISHER,
				});
				const autoGroupExternalUuidCustomParameter = customParameterFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.QUERY,
					name: 'autoGroupExternalUuidParam',
					type: CustomParameterType.AUTO_GROUP_EXTERNALUUID,
				});
				const fragmentLocationCustomParameter = customParameterFactory.build({
					scope: CustomParameterScope.CONTEXT,
					location: CustomParameterLocation.FRAGMENT,
					type: CustomParameterType.STRING,
				});

				const mediumId = 'medium:xyz';
				const publisher = 'publisher_abc';
				const externalTool: ExternalTool = externalToolFactory
					.withBasicConfig({
						baseUrl: 'https://www.basic-baseurl.com/:globalParam',
					})
					.build({
						parameters: [
							globalCustomParameter,
							schoolCustomParameter,
							contextCustomParameter,
							autoSchoolIdCustomParameter,
							autoSchoolNumberCustomParameter,
							autoContextIdCustomParameter,
							autoContextNameCustomParameter,
							autoMediumIdCustomParameter,
							autoPublisherCustomParameter,
							autoGroupExternalUuidCustomParameter,
							fragmentLocationCustomParameter,
						],
						medium: {
							mediumId,
							publisher,
						},
					});

				// School External Tool
				const schoolId: string = new ObjectId().toHexString();
				const schoolParameterEntry: CustomParameterEntry = new CustomParameterEntry({
					name: schoolCustomParameter.name,
					value: 'true',
				});

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					parameters: [schoolParameterEntry],
					schoolId,
				});

				// Context External Tool
				const contextId = new ObjectId().toHexString();
				const contextParameterValue = '123';

				const contextParameterEntry: CustomParameterEntry = new CustomParameterEntry({
					name: contextCustomParameter.name,
					value: contextParameterValue,
				});

				const fragmentValue = 'test-anchor';
				const fragmentParameterEntry: CustomParameterEntry = new CustomParameterEntry({
					name: fragmentLocationCustomParameter.name,
					value: fragmentValue,
				});

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					parameters: [contextParameterEntry, fragmentParameterEntry],
					contextRef: {
						id: contextId,
						type: ToolContextType.COURSE,
					},
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

				const schoolNumber = '12345';
				const contextName = 'Course XYZ';
				const groupExternalUuid = '21938124712984';

				autoSchoolIdStrategy.getValue.mockReturnValueOnce(schoolId);
				autoSchoolNumberStrategy.getValue.mockResolvedValueOnce(schoolNumber);
				autoContextIdStrategy.getValue.mockReturnValueOnce(contextId);
				autoContextNameStrategy.getValue.mockResolvedValueOnce(contextName);
				autoMediumIdStrategy.getValue.mockResolvedValueOnce(mediumId);
				autoPublisherStrategy.getValue.mockResolvedValueOnce(publisher);
				autoGroupExternalUuidStrategy.getValue.mockResolvedValueOnce(groupExternalUuid);

				const expectedUrl = new URL(`https://www.basic-baseurl.com/${globalCustomParameter.default as string}`);
				expectedUrl.searchParams.set(contextCustomParameter.name, contextParameterEntry.value as string);
				expectedUrl.searchParams.set(autoMediumIdCustomParameter.name, mediumId);
				expectedUrl.searchParams.set(autoGroupExternalUuidCustomParameter.name, groupExternalUuid);
				expectedUrl.hash = fragmentValue;

				const expectedProperties: PropertyData[] = [
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
						name: fragmentParameterEntry.name,
						value: fragmentParameterEntry.value as string,
						location: PropertyLocation.FRAGMENT,
					},
					{
						name: autoSchoolIdCustomParameter.name,
						value: schoolId,
						location: PropertyLocation.BODY,
					},
					{
						name: autoSchoolNumberCustomParameter.name,
						value: schoolNumber,
						location: PropertyLocation.BODY,
					},
					{
						name: autoContextIdCustomParameter.name,
						value: contextId,
						location: PropertyLocation.BODY,
					},
					{
						name: autoContextNameCustomParameter.name,
						value: contextName,
						location: PropertyLocation.BODY,
					},
					{
						name: autoMediumIdCustomParameter.name,
						value: mediumId,
						location: PropertyLocation.QUERY,
					},
					{
						name: autoPublisherCustomParameter.name,
						value: publisher,
						location: PropertyLocation.BODY,
					},
					{
						name: autoGroupExternalUuidCustomParameter.name,
						value: groupExternalUuid,
						location: PropertyLocation.QUERY,
					},
					{
						name: concreteConfigParameter.name,
						value: concreteConfigParameter.value,
						location: concreteConfigParameter.location,
					},
				];

				return {
					globalCustomParameter,
					schoolCustomParameter,
					contextCustomParameter,
					autoSchoolIdCustomParameter,
					autoSchoolNumberCustomParameter,
					autoContextIdCustomParameter,
					autoContextNameCustomParameter,
					autoMediumIdCustomParameter,
					autoPublisherCustomParameter,
					autoGroupExternalUuidCustomParameter,
					schoolParameterEntry,
					contextParameterEntry,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					schoolId,
					schoolNumber,
					contextId,
					contextName,
					mediumId,
					groupExternalUuid,
					sortFn,
					expectedUrl,
					expectedProperties,
				};
			};

			it('should return ToolLaunchRequest with merged parameters', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, expectedUrl, expectedProperties } = setup();

				const result: ToolLaunchRequest = await strategy.createLaunchRequest('userId', {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				});

				expect(result).toEqual<ToolLaunchRequest>({
					url: expectedUrl.toString(),
					method: strategy.determineLaunchRequestMethod(expectedProperties),
					openNewTab: false,
					payload: strategy.buildToolLaunchRequestPayload(expectedUrl.toString(), expectedProperties),
					launchType: strategy.determineLaunchType(),
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

				expect(result).toEqual<ToolLaunchRequest>({
					url: externalTool.config.baseUrl,
					method: strategy.determineLaunchRequestMethod([concreteConfigParameter]),
					openNewTab: false,
					payload: strategy.buildToolLaunchRequestPayload(externalTool.config.baseUrl, [concreteConfigParameter]),
					launchType: strategy.determineLaunchType(),
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

		describe('when a parameter has fragment location', () => {
			const setup = () => {
				const parameter = customParameterFactory.build({
					type: CustomParameterType.STRING,
					scope: CustomParameterScope.SCHOOL,
					location: CustomParameterLocation.FRAGMENT,
				});

				const baseUrl = 'https://test.com/';
				const externalTool: ExternalTool = externalToolFactory.withBasicConfig({ baseUrl }).build({
					parameters: [parameter],
					url: baseUrl,
				});

				const fragmentValue = 'test-anchor';
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					parameters: [
						new CustomParameterEntry({
							name: parameter.name,
							value: fragmentValue,
						}),
					],
				});

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					parameters: [],
				});

				const expectedUrl = `${baseUrl}#${fragmentValue}`;

				const expectedProperties: PropertyData[] = [
					{
						name: parameter.name,
						value: fragmentValue,
						location: PropertyLocation.FRAGMENT,
					},
					{
						name: concreteConfigParameter.name,
						value: concreteConfigParameter.value,
						location: concreteConfigParameter.location,
					},
				];

				return {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					expectedUrl,
					expectedProperties,
				};
			};

			it('should return a launch request with correct values', async () => {
				const { externalTool, schoolExternalTool, contextExternalTool, expectedUrl, expectedProperties } = setup();

				const result = await strategy.createLaunchRequest(new ObjectId().toHexString(), {
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				});

				expect(result).toEqual<ToolLaunchRequest>({
					url: expectedUrl.toString(),
					method: strategy.determineLaunchRequestMethod(expectedProperties),
					openNewTab: false,
					payload: strategy.buildToolLaunchRequestPayload(expectedUrl.toString(), expectedProperties),
					launchType: strategy.determineLaunchType(),
				});
			});
		});
	});
});
