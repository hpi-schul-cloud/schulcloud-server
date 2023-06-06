import {
	BasicToolConfigDO,
	ContextExternalToolDO,
	CustomParameterEntryDO,
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	ExternalToolConfigDO,
	ExternalToolDO,
	SchoolExternalToolDO,
} from '@shared/domain';
import {
	basicToolConfigDOFactory,
	contextExternalToolDOFactory,
	customParameterDOFactory,
	externalToolDOFactory,
	schoolExternalToolDOFactory,
} from '@shared/testing';
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

const concreteConfigParameter: PropertyData = {
	location: PropertyLocation.QUERY,
	name: 'concreteParam',
	value: 'test',
};

const expectedPayload = 'payload';

class TestLaunchStrategy extends AbstractLaunchStrategy {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected buildToolLaunchDataFromConcreteConfig(config: ExternalToolConfigDO): PropertyData[] {
		// Implement this method with your own logic for the mock launch strategy
		return [concreteConfigParameter];
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected buildToolLaunchRequestPayload(properties: PropertyData[]): string {
		return expectedPayload;
	}
}

describe('AbstractLaunchStrategy', () => {
	let launchStrategy: TestLaunchStrategy;

	beforeEach(() => {
		launchStrategy = new TestLaunchStrategy();
	});

	describe('createLaunchData', () => {
		const setup = () => {
			const basicToolConfigDO: BasicToolConfigDO = basicToolConfigDOFactory.build();

			const globalCustomParameter = customParameterDOFactory.build({
				scope: CustomParameterScope.GLOBAL,
				location: CustomParameterLocation.PATH,
				default: 'value',
				name: 'globalParam',
				type: CustomParameterType.STRING,
			});

			const schoolCustomParameter = customParameterDOFactory.build({
				scope: CustomParameterScope.SCHOOL,
				location: CustomParameterLocation.QUERY,
				name: 'schoolParam',
				type: CustomParameterType.AUTO_SCHOOLID,
			});

			const contextCustomParameter = customParameterDOFactory.build({
				scope: CustomParameterScope.CONTEXT,
				location: CustomParameterLocation.BODY,
				name: 'contextParam',
				type: CustomParameterType.AUTO_COURSEID,
			});

			const externalToolDO: ExternalToolDO = externalToolDOFactory.build({
				config: basicToolConfigDO,
				parameters: [globalCustomParameter, schoolCustomParameter, contextCustomParameter],
			});

			const schoolParameterEntry: CustomParameterEntryDO = new CustomParameterEntryDO({
				name: schoolCustomParameter.name,
				value: 'anyValue',
			});
			const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.build({
				parameters: [schoolParameterEntry],
			});

			const contextParameterEntry: CustomParameterEntryDO = new CustomParameterEntryDO({
				name: contextCustomParameter.name,
				value: 'anyValue',
			});
			const contextExternalToolDO: ContextExternalToolDO = contextExternalToolDOFactory.build({
				parameters: [contextParameterEntry],
			});

			return {
				globalCustomParameter,
				schoolCustomParameter,
				contextCustomParameter,
				schoolParameterEntry,
				contextParameterEntry,
				externalToolDO,
				schoolExternalToolDO,
				basicToolConfigDO,
				contextExternalToolDO,
			};
		};

		it('should return a ToolLaunchDataDO with merged parameters', () => {
			const {
				globalCustomParameter,
				schoolCustomParameter,
				contextCustomParameter,
				externalToolDO,
				schoolExternalToolDO,
				contextExternalToolDO,
			} = setup();

			const launchParams: IToolLaunchParams = {
				externalToolDO,
				schoolExternalToolDO,
				contextExternalToolDO,
			};

			const result: ToolLaunchData = launchStrategy.createLaunchData(launchParams);

			expect(result).toEqual<ToolLaunchData>({
				baseUrl: launchParams.externalToolDO.config.baseUrl,
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
						value: launchParams.schoolExternalToolDO.schoolId,
						location: PropertyLocation.QUERY,
					},
					{
						name: contextCustomParameter.name,
						value: launchParams.contextExternalToolDO.contextRef.id,
						location: PropertyLocation.BODY,
					},
					{
						name: concreteConfigParameter.name,
						value: concreteConfigParameter.value,
						location: concreteConfigParameter.location,
					},
				],
			});
		});

		it('should return a ToolLaunchDataDO with no custom parameters', () => {
			const { externalToolDO, schoolExternalToolDO, contextExternalToolDO } = setup();
			const launchParams: IToolLaunchParams = {
				externalToolDO,
				schoolExternalToolDO,
				contextExternalToolDO,
			};
			externalToolDO.parameters = [];
			schoolExternalToolDO.parameters = [];
			contextExternalToolDO.parameters = [];

			const result: ToolLaunchData = launchStrategy.createLaunchData(launchParams);

			expect(result).toEqual<ToolLaunchData>({
				baseUrl: launchParams.externalToolDO.config.baseUrl,
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

		it('should return a ToolLaunchDataDO with only global custom parameters', () => {
			const { externalToolDO, schoolExternalToolDO, contextExternalToolDO, globalCustomParameter } = setup();
			const launchParams: IToolLaunchParams = {
				externalToolDO,
				schoolExternalToolDO,
				contextExternalToolDO,
			};
			externalToolDO.parameters = [globalCustomParameter];
			schoolExternalToolDO.parameters = [];
			contextExternalToolDO.parameters = [];

			const result: ToolLaunchData = launchStrategy.createLaunchData(launchParams);

			expect(result).toEqual<ToolLaunchData>({
				baseUrl: launchParams.externalToolDO.config.baseUrl,
				type: ToolLaunchDataType.BASIC,
				openNewTab: false,
				properties: [
					{
						name: globalCustomParameter.name,
						value: globalCustomParameter.default as string,
						location: PropertyLocation.PATH,
					},
					{
						name: concreteConfigParameter.name,
						value: concreteConfigParameter.value,
						location: concreteConfigParameter.location,
					},
				],
			});
		});

		it('should return a ToolLaunchDataDO with only school custom parameters', () => {
			const {
				externalToolDO,
				schoolExternalToolDO,
				contextExternalToolDO,
				schoolCustomParameter,
				schoolParameterEntry,
			} = setup();
			const launchParams: IToolLaunchParams = {
				externalToolDO,
				schoolExternalToolDO,
				contextExternalToolDO,
			};
			externalToolDO.parameters = [schoolCustomParameter];
			schoolExternalToolDO.parameters = [schoolParameterEntry];
			contextExternalToolDO.parameters = [];

			const result: ToolLaunchData = launchStrategy.createLaunchData(launchParams);

			expect(result).toEqual<ToolLaunchData>({
				baseUrl: launchParams.externalToolDO.config.baseUrl,
				type: ToolLaunchDataType.BASIC,
				openNewTab: false,
				properties: [
					{
						name: schoolCustomParameter.name,
						value: launchParams.schoolExternalToolDO.schoolId,
						location: PropertyLocation.QUERY,
					},
					{
						name: concreteConfigParameter.name,
						value: concreteConfigParameter.value,
						location: concreteConfigParameter.location,
					},
				],
			});
		});

		it('should return a ToolLaunchDataDO with only context custom parameters', () => {
			const {
				externalToolDO,
				schoolExternalToolDO,
				contextExternalToolDO,
				contextCustomParameter,
				contextParameterEntry,
			} = setup();
			const launchParams: IToolLaunchParams = {
				externalToolDO,
				schoolExternalToolDO,
				contextExternalToolDO,
			};
			externalToolDO.parameters = [contextCustomParameter];
			schoolExternalToolDO.parameters = [];
			contextExternalToolDO.parameters = [contextParameterEntry];

			const result: ToolLaunchData = launchStrategy.createLaunchData(launchParams);

			expect(result).toEqual<ToolLaunchData>({
				baseUrl: launchParams.externalToolDO.config.baseUrl,
				type: ToolLaunchDataType.BASIC,
				openNewTab: false,
				properties: [
					{
						name: contextCustomParameter.name,
						value: launchParams.contextExternalToolDO.contextRef.id,
						location: PropertyLocation.BODY,
					},
					{
						name: concreteConfigParameter.name,
						value: concreteConfigParameter.value,
						location: concreteConfigParameter.location,
					},
				],
			});
		});
	});

	describe('createLaunchRequest', () => {
		const setup = () => {
			const toolLaunchDataDO: ToolLaunchData = new ToolLaunchData({
				type: ToolLaunchDataType.BASIC,
				baseUrl: 'https://www.basic-baseurl.com/',
				properties: [],
				openNewTab: false,
			});

			return {
				toolLaunchDataDO,
			};
		};

		it('should create a LaunchRequestDO with the correct method, url and payload', () => {
			const { toolLaunchDataDO } = setup();

			const propertyData1 = new PropertyData({
				name: 'search',
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
				url: `${toolLaunchDataDO.baseUrl}${propertyData1.value}?${propertyData2.name}=${propertyData2.value}`,
				payload: expectedPayload,
				openNewTab: toolLaunchDataDO.openNewTab,
			});
		});

		it('should create a LaunchRequestDO with POST method when there is a BODY property', () => {
			const { toolLaunchDataDO } = setup();

			const bodyProperty = new PropertyData({
				name: 'content',
				value: 'test content',
				location: PropertyLocation.BODY,
			});
			toolLaunchDataDO.properties = [bodyProperty];

			const result: ToolLaunchRequest = launchStrategy.createLaunchRequest(toolLaunchDataDO);

			expect(result.method).toEqual(LaunchRequestMethod.POST);
		});

		it('should create a LaunchRequestDO with the correct payload when there are BODY properties', () => {
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

		it('should create a LaunchRequestDO with the correct url when there are PATH and QUERY properties', () => {
			const { toolLaunchDataDO } = setup();

			const pathProperty = new PropertyData({
				name: 'pathSegment',
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
				`${toolLaunchDataDO.baseUrl}${pathProperty.value}?${queryProperty.name}=${queryProperty.value}`
			);
		});
	});
});
