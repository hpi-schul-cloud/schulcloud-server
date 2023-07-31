import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, EntityId, SchoolDO } from '@shared/domain';
import { CourseRepo } from '@shared/repo';
import {
	contextExternalToolDOFactory,
	courseFactory,
	customParameterDOFactory,
	externalToolDOFactory,
	schoolDOFactory,
	schoolExternalToolDOFactory,
	setupEntities,
} from '@shared/testing';
import { SchoolService } from '@src/modules/school';
import { MissingToolParameterValueLoggableException, ParameterTypeNotImplementedLoggableException } from '../../error';
import {
	LaunchRequestMethod,
	PropertyData,
	PropertyLocation,
	ToolLaunchData,
	ToolLaunchDataType,
	ToolLaunchRequest,
} from '../../types';
import { AbstractLaunchStrategy } from './abstract-launch.strategy';
import { IToolLaunchParams } from './tool-launch-params.interface';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	ToolContextType,
} from '../../../common/enum';
import { ExternalTool } from '../../../external-tool/domain';
import { CustomParameterEntryDO } from '../../../common/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { ContextExternalTool } from '../../../context-external-tool/domain';

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
		config: IToolLaunchParams
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

describe('AbstractLaunchStrategy', () => {
	let module: TestingModule;
	let launchStrategy: TestLaunchStrategy;

	let schoolService: DeepMocked<SchoolService>;
	let courseRepo: DeepMocked<CourseRepo>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				TestLaunchStrategy,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
			],
		}).compile();

		launchStrategy = module.get(TestLaunchStrategy);
		schoolService = module.get(SchoolService);
		courseRepo = module.get(CourseRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('createLaunchData', () => {
		describe('when parameters of every type are defined', () => {
			const setup = () => {
				const schoolId: string = new ObjectId().toHexString();

				// External Tool
				const globalCustomParameter = customParameterDOFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.PATH,
					default: 'value',
					name: 'globalParam',
					type: CustomParameterType.STRING,
				});
				const schoolCustomParameter = customParameterDOFactory.build({
					scope: CustomParameterScope.SCHOOL,
					location: CustomParameterLocation.BODY,
					name: 'schoolParam',
					type: CustomParameterType.BOOLEAN,
				});
				const contextCustomParameter = customParameterDOFactory.build({
					scope: CustomParameterScope.CONTEXT,
					location: CustomParameterLocation.QUERY,
					name: 'contextParam',
					type: CustomParameterType.NUMBER,
				});
				const autoSchoolIdCustomParameter = customParameterDOFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.BODY,
					name: 'autoSchoolIdParam',
					type: CustomParameterType.AUTO_SCHOOLID,
				});
				const autoCourseIdCustomParameter = customParameterDOFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.BODY,
					name: 'autoCourseIdParam',
					type: CustomParameterType.AUTO_CONTEXTID,
				});
				const autoCourseNameCustomParameter = customParameterDOFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.BODY,
					name: 'autoCourseNameParam',
					type: CustomParameterType.AUTO_CONTEXTNAME,
				});
				const autoSchoolNumberCustomParameter = customParameterDOFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.BODY,
					name: 'autoSchoolNumberParam',
					type: CustomParameterType.AUTO_SCHOOLNUMBER,
				});

				const externalToolDO: ExternalTool = externalToolDOFactory.build({
					parameters: [
						globalCustomParameter,
						schoolCustomParameter,
						contextCustomParameter,
						autoSchoolIdCustomParameter,
						autoCourseIdCustomParameter,
						autoCourseNameCustomParameter,
						autoSchoolNumberCustomParameter,
					],
				});

				// School External Tool
				const schoolParameterEntry: CustomParameterEntryDO = new CustomParameterEntryDO({
					name: schoolCustomParameter.name,
					value: 'true',
				});
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolDOFactory.build({
					parameters: [schoolParameterEntry],
					schoolId,
				});

				// Context External Tool
				const contextParameterEntry: CustomParameterEntryDO = new CustomParameterEntryDO({
					name: contextCustomParameter.name,
					value: 'anyValue2',
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolDOFactory.build({
					parameters: [contextParameterEntry],
				});

				// Other
				const school: SchoolDO = schoolDOFactory.buildWithId(
					{
						officialSchoolNumber: '1234',
					},
					schoolId
				);

				const course: Course = courseFactory.buildWithId(
					{
						name: 'testName',
					},
					contextExternalTool.contextRef.id
				);

				schoolService.getSchoolById.mockResolvedValue(school);
				courseRepo.findById.mockResolvedValue(course);

				const sortFn = (a: PropertyData, b: PropertyData) => {
					if (a.name < b.name) {
						return -1;
					}
					if (a.name > b.name) {
						return 1;
					}
					return 0;
				};

				return {
					globalCustomParameter,
					schoolCustomParameter,
					autoSchoolIdCustomParameter,
					autoCourseIdCustomParameter,
					autoCourseNameCustomParameter,
					autoSchoolNumberCustomParameter,
					schoolParameterEntry,
					contextParameterEntry,
					externalToolDO,
					schoolExternalTool,
					contextExternalTool,
					course,
					school,
					sortFn,
				};
			};

			it('should return ToolLaunchData with merged parameters', async () => {
				const {
					globalCustomParameter,
					schoolCustomParameter,
					contextParameterEntry,
					autoSchoolIdCustomParameter,
					autoCourseIdCustomParameter,
					autoCourseNameCustomParameter,
					autoSchoolNumberCustomParameter,
					schoolParameterEntry,
					externalToolDO,
					schoolExternalTool,
					contextExternalTool,
					course,
					school,
					sortFn,
				} = setup();

				const result: ToolLaunchData = await launchStrategy.createLaunchData('userId', {
					externalToolDO,
					schoolExternalToolDO: schoolExternalTool,
					contextExternalToolDO: contextExternalTool,
				});

				result.properties = result.properties.sort(sortFn);
				expect(result).toEqual<ToolLaunchData>({
					baseUrl: externalToolDO.config.baseUrl,
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
							value: school.id as string,
							location: PropertyLocation.BODY,
						},
						{
							name: autoCourseIdCustomParameter.name,
							value: course.id,
							location: PropertyLocation.BODY,
						},
						{
							name: autoCourseNameCustomParameter.name,
							value: course.name,
							location: PropertyLocation.BODY,
						},
						{
							name: autoSchoolNumberCustomParameter.name,
							value: school.officialSchoolNumber as string,
							location: PropertyLocation.BODY,
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
				const externalToolDO: ExternalTool = externalToolDOFactory.build({
					parameters: [],
				});

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolDOFactory.build({
					parameters: [],
				});

				const contextExternalTool: ContextExternalTool = contextExternalToolDOFactory.build({
					parameters: [],
				});

				return {
					externalToolDO,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return a ToolLaunchData with no custom parameters', async () => {
				const { externalToolDO, schoolExternalTool, contextExternalTool } = setup();

				const result: ToolLaunchData = await launchStrategy.createLaunchData('userId', {
					externalToolDO,
					schoolExternalToolDO: schoolExternalTool,
					contextExternalToolDO: contextExternalTool,
				});

				expect(result).toEqual<ToolLaunchData>({
					baseUrl: externalToolDO.config.baseUrl,
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
				const autoSchoolNumberCustomParameter = customParameterDOFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.BODY,
					name: 'autoSchoolNumberParam',
					type: CustomParameterType.AUTO_SCHOOLNUMBER,
				});
				const externalToolDO: ExternalTool = externalToolDOFactory.build({
					parameters: [autoSchoolNumberCustomParameter],
				});

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolDOFactory.build({
					parameters: [],
				});

				const contextExternalTool: ContextExternalTool = contextExternalToolDOFactory.build({
					parameters: [],
				});

				const school: SchoolDO = schoolDOFactory.buildWithId({
					officialSchoolNumber: undefined,
				});

				schoolService.getSchoolById.mockResolvedValue(school);

				return {
					externalToolDO,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should throw a MissingToolParameterValueLoggableException', async () => {
				const { externalToolDO, schoolExternalTool, contextExternalTool } = setup();

				const func = async () =>
					launchStrategy.createLaunchData('userId', {
						externalToolDO,
						schoolExternalToolDO: schoolExternalTool,
						contextExternalToolDO: contextExternalTool,
					});

				await expect(func).rejects.toThrow(MissingToolParameterValueLoggableException);
			});
		});

		describe('when a parameter type is not implemented ', () => {
			const setup = () => {
				const customParameterWithUnknownType = customParameterDOFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.BODY,
					name: 'unknownTypeParam',
					type: 'unknownType' as unknown as CustomParameterType,
				});
				const externalToolDO: ExternalTool = externalToolDOFactory.build({
					parameters: [customParameterWithUnknownType],
				});

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolDOFactory.build({
					parameters: [],
				});

				const contextExternalTool: ContextExternalTool = contextExternalToolDOFactory.build({
					parameters: [],
				});

				return {
					externalToolDO,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should throw a ParameterNotImplementedLoggableException', async () => {
				const { externalToolDO, schoolExternalTool, contextExternalTool } = setup();

				const func = async () =>
					launchStrategy.createLaunchData('userId', {
						externalToolDO,
						schoolExternalToolDO: schoolExternalTool,
						contextExternalToolDO: contextExternalTool,
					});

				await expect(func).rejects.toThrow(ParameterTypeNotImplementedLoggableException);
			});
		});

		describe('when a lookup for a context name is not implemented', () => {
			const setup = () => {
				const customParameterWithUnknownType = customParameterDOFactory.build({
					scope: CustomParameterScope.GLOBAL,
					location: CustomParameterLocation.BODY,
					name: 'autoContextNameParam',
					type: CustomParameterType.AUTO_CONTEXTNAME,
				});
				const externalToolDO: ExternalTool = externalToolDOFactory.build({
					parameters: [customParameterWithUnknownType],
				});

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolDOFactory.build({
					parameters: [],
				});

				const contextExternalTool: ContextExternalTool = contextExternalToolDOFactory.build({
					contextRef: {
						id: new ObjectId().toHexString(),
						type: 'unknownContext' as unknown as ToolContextType,
					},
					parameters: [],
				});

				return {
					externalToolDO,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should throw a ParameterNotImplementedLoggableException', async () => {
				const { externalToolDO, schoolExternalTool, contextExternalTool } = setup();

				const func = async () =>
					launchStrategy.createLaunchData('userId', {
						externalToolDO,
						schoolExternalToolDO: schoolExternalTool,
						contextExternalToolDO: contextExternalTool,
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

			const result: ToolLaunchRequest = launchStrategy.createLaunchRequest(toolLaunchDataDO);

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

			const result: ToolLaunchRequest = launchStrategy.createLaunchRequest(toolLaunchDataDO);

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

			const result: ToolLaunchRequest = launchStrategy.createLaunchRequest(toolLaunchDataDO);

			expect(result.url).toEqual(
				`https://www.basic-baseurl.com/pre/${pathProperty.value}/post?${queryProperty.name}=${queryProperty.value}`
			);
		});
	});
});
