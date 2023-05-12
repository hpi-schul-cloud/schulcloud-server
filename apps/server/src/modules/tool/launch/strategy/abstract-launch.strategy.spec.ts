import {
	BasicToolConfigDO,
	ContextExternalToolDO,
	CustomParameterEntryDO,
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	ExternalToolConfigDO,
	ExternalToolDO,
	ToolLaunchRequestDO,
	LaunchRequestMethod,
	PropertyDataDO,
	PropertyLocation,
	SchoolExternalToolDO,
	ToolLaunchDataDO,
} from '@shared/domain';
import {
	basicToolConfigDOFactory,
	contextExternalToolDOFactory,
	customParameterDOFactory,
	externalToolDOFactory,
	propertyDataDOFactory,
	schoolExternalToolDOFactory,
	toolLaunchDataFactory,
} from '@shared/testing';
import { ToolLaunchDataType } from '@shared/domain/domainobject/tool/launch/tool-launch-data-type';
import { AbstractLaunchStrategy } from './abstract-launch.strategy';
import { IToolLaunchParams } from './tool-launch-params.interface';

const concreteConfigParameter: PropertyDataDO = {
	location: PropertyLocation.QUERY,
	name: 'concreteParam',
	value: 'test',
};

const expectedPayload = 'payload';

class TestLaunchStrategy extends AbstractLaunchStrategy {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected buildToolLaunchDataFromConcreteConfig(config: ExternalToolConfigDO): PropertyDataDO[] {
		// Implement this method with your own logic for the mock launch strategy
		return [concreteConfigParameter];
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected buildToolLaunchRequestPayload(properties: PropertyDataDO[]): string {
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
				basicToolConfigDO,
			} = setup();

			const launchParams: IToolLaunchParams = {
				externalToolDO,
				schoolExternalToolDO,
				config: basicToolConfigDO,
				contextExternalToolDO,
			};

			const result: ToolLaunchDataDO = launchStrategy.createLaunchData(launchParams);

			expect(result).toEqual<ToolLaunchDataDO>({
				baseUrl: launchParams.config.baseUrl,
				type: ToolLaunchDataType.BASIC,
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
						value: launchParams.contextExternalToolDO.contextId,
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
			const { externalToolDO, schoolExternalToolDO, contextExternalToolDO, basicToolConfigDO } = setup();
			const launchParams: IToolLaunchParams = {
				externalToolDO,
				schoolExternalToolDO,
				config: basicToolConfigDO,
				contextExternalToolDO,
			};
			externalToolDO.parameters = [];
			schoolExternalToolDO.parameters = [];
			contextExternalToolDO.parameters = [];

			const result: ToolLaunchDataDO = launchStrategy.createLaunchData(launchParams);

			expect(result).toEqual<ToolLaunchDataDO>({
				baseUrl: launchParams.config.baseUrl,
				type: ToolLaunchDataType.BASIC,
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
			const { externalToolDO, schoolExternalToolDO, contextExternalToolDO, basicToolConfigDO, globalCustomParameter } =
				setup();
			const launchParams: IToolLaunchParams = {
				externalToolDO,
				schoolExternalToolDO,
				config: basicToolConfigDO,
				contextExternalToolDO,
			};
			externalToolDO.parameters = [globalCustomParameter];
			schoolExternalToolDO.parameters = [];
			contextExternalToolDO.parameters = [];

			const result: ToolLaunchDataDO = launchStrategy.createLaunchData(launchParams);

			expect(result).toEqual<ToolLaunchDataDO>({
				baseUrl: launchParams.config.baseUrl,
				type: ToolLaunchDataType.BASIC,
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
				basicToolConfigDO,
				schoolCustomParameter,
				schoolParameterEntry,
			} = setup();
			const launchParams: IToolLaunchParams = {
				externalToolDO,
				schoolExternalToolDO,
				config: basicToolConfigDO,
				contextExternalToolDO,
			};
			externalToolDO.parameters = [schoolCustomParameter];
			schoolExternalToolDO.parameters = [schoolParameterEntry];
			contextExternalToolDO.parameters = [];

			const result: ToolLaunchDataDO = launchStrategy.createLaunchData(launchParams);

			expect(result).toEqual<ToolLaunchDataDO>({
				baseUrl: launchParams.config.baseUrl,
				type: ToolLaunchDataType.BASIC,
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
				basicToolConfigDO,
				contextCustomParameter,
				contextParameterEntry,
			} = setup();
			const launchParams: IToolLaunchParams = {
				externalToolDO,
				schoolExternalToolDO,
				config: basicToolConfigDO,
				contextExternalToolDO,
			};
			externalToolDO.parameters = [contextCustomParameter];
			schoolExternalToolDO.parameters = [];
			contextExternalToolDO.parameters = [contextParameterEntry];

			const result: ToolLaunchDataDO = launchStrategy.createLaunchData(launchParams);

			expect(result).toEqual<ToolLaunchDataDO>({
				baseUrl: launchParams.config.baseUrl,
				type: ToolLaunchDataType.BASIC,
				properties: [
					{
						name: contextCustomParameter.name,
						value: launchParams.contextExternalToolDO.contextId,
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
			const toolLaunchDataDO: ToolLaunchDataDO = toolLaunchDataFactory.build();

			return {
				toolLaunchDataDO,
			};
		};

		it('should create a LaunchRequestDO with the correct method, url and payload', () => {
			const { toolLaunchDataDO } = setup();

			const propertyData1 = propertyDataDOFactory.build({
				name: 'search',
				value: 'searchValue',
				location: PropertyLocation.PATH,
			});
			const propertyData2 = propertyDataDOFactory.build({
				name: 'test',
				value: 'test',
				location: PropertyLocation.QUERY,
			});
			toolLaunchDataDO.properties = [propertyData1, propertyData2];

			const result: ToolLaunchRequestDO = launchStrategy.createLaunchRequest(toolLaunchDataDO);

			expect(result).toEqual<ToolLaunchRequestDO>({
				method: LaunchRequestMethod.GET,
				url: `${toolLaunchDataDO.baseUrl}${propertyData1.value}?${propertyData2.name}=${propertyData2.value}`,
				payload: expectedPayload,
			});
		});

		it('should create a LaunchRequestDO with POST method when there is a BODY property', () => {
			const { toolLaunchDataDO } = setup();

			const bodyProperty = propertyDataDOFactory.build({
				name: 'content',
				value: 'test content',
				location: PropertyLocation.BODY,
			});
			toolLaunchDataDO.properties = [bodyProperty];

			const result: ToolLaunchRequestDO = launchStrategy.createLaunchRequest(toolLaunchDataDO);

			expect(result.method).toEqual(LaunchRequestMethod.POST);
		});

		it('should create a LaunchRequestDO with the correct payload when there are BODY properties', () => {
			const { toolLaunchDataDO } = setup();

			const bodyProperty1 = propertyDataDOFactory.build({
				name: 'key1',
				value: 'value1',
				location: PropertyLocation.BODY,
			});
			const bodyProperty2 = propertyDataDOFactory.build({
				name: 'key2',
				value: 'value2',
				location: PropertyLocation.BODY,
			});
			toolLaunchDataDO.properties = [bodyProperty1, bodyProperty2];

			const result: ToolLaunchRequestDO = launchStrategy.createLaunchRequest(toolLaunchDataDO);

			expect(result.payload).toEqual(expectedPayload);
		});

		it('should create a LaunchRequestDO with the correct url when there are PATH and QUERY properties', () => {
			const { toolLaunchDataDO } = setup();

			const pathProperty = propertyDataDOFactory.build({
				name: 'pathSegment',
				value: 'segmentValue',
				location: PropertyLocation.PATH,
			});
			const queryProperty = propertyDataDOFactory.build({
				name: 'queryParam',
				value: 'queryValue',
				location: PropertyLocation.QUERY,
			});
			toolLaunchDataDO.properties = [pathProperty, queryProperty];

			const result: ToolLaunchRequestDO = launchStrategy.createLaunchRequest(toolLaunchDataDO);

			expect(result.url).toEqual(
				`${toolLaunchDataDO.baseUrl}${pathProperty.value}?${queryProperty.name}=${queryProperty.value}`
			);
		});
	});
});
