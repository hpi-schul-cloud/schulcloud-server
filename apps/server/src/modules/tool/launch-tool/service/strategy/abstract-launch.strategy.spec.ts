import {
	BasicToolConfigDO,
	ContextExternalToolDO,
	CustomParameterEntryDO,
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	EntityId,
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

const launchMethod = LaunchRequestMethod.GET;

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
				location: CustomParameterLocation.PATH,
				name: 'schoolParam',
				type: CustomParameterType.BOOLEAN,
			});

			const schoolCustomParameterAuto = customParameterDOFactory.build({
				scope: CustomParameterScope.SCHOOL,
				location: CustomParameterLocation.QUERY,
				name: 'schoolParam',
				type: CustomParameterType.AUTO_SCHOOLID,
			});

			const contextCustomParameterAuto = customParameterDOFactory.build({
				scope: CustomParameterScope.CONTEXT,
				location: CustomParameterLocation.BODY,
				name: 'contextParam',
				type: CustomParameterType.AUTO_COURSEID,
			});

			const externalToolDO: ExternalToolDO = externalToolDOFactory.build({
				config: basicToolConfigDO,
				parameters: [
					globalCustomParameter,
					schoolCustomParameter,
					schoolCustomParameterAuto,
					contextCustomParameterAuto,
				],
			});

			const schoolParameterEntry: CustomParameterEntryDO = new CustomParameterEntryDO({
				name: schoolCustomParameter.name,
				value: 'anyValue',
			});
			const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.build({
				parameters: [schoolParameterEntry],
			});

			const contextParameterEntry: CustomParameterEntryDO = new CustomParameterEntryDO({
				name: contextCustomParameterAuto.name,
				value: 'anyValue',
			});
			const contextExternalToolDO: ContextExternalToolDO = contextExternalToolDOFactory.build({
				parameters: [contextParameterEntry],
			});

			return {
				globalCustomParameter,
				schoolCustomParameter,
				schoolCustomParameterAuto,
				contextCustomParameterAuto,
				schoolParameterEntry,
				contextParameterEntry,
				externalToolDO,
				schoolExternalToolDO,
				basicToolConfigDO,
				contextExternalToolDO,
			};
		};

		it('should return a ToolLaunchDataDO with merged parameters', async () => {
			const {
				globalCustomParameter,
				schoolCustomParameter,
				schoolCustomParameterAuto,
				contextCustomParameterAuto,
				schoolParameterEntry,
				externalToolDO,
				schoolExternalToolDO,
				contextExternalToolDO,
			} = setup();

			const launchParams: IToolLaunchParams = {
				externalToolDO,
				schoolExternalToolDO,
				contextExternalToolDO,
			};

			const result: ToolLaunchData = await launchStrategy.createLaunchData('userId', launchParams);

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
						value: schoolParameterEntry.value as string,
						location: PropertyLocation.PATH,
					},
					{
						name: schoolCustomParameterAuto.name,
						value: launchParams.schoolExternalToolDO.schoolId,
						location: PropertyLocation.QUERY,
					},
					{
						name: contextCustomParameterAuto.name,
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

		it('should return a ToolLaunchDataDO with no custom parameters', async () => {
			const { externalToolDO, schoolExternalToolDO, contextExternalToolDO } = setup();
			const launchParams: IToolLaunchParams = {
				externalToolDO,
				schoolExternalToolDO,
				contextExternalToolDO,
			};
			externalToolDO.parameters = [];
			schoolExternalToolDO.parameters = [];
			contextExternalToolDO.parameters = [];

			const result: ToolLaunchData = await launchStrategy.createLaunchData('userId', launchParams);

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

		it('should return a ToolLaunchDataDO with only global custom parameters', async () => {
			const { externalToolDO, schoolExternalToolDO, contextExternalToolDO, globalCustomParameter } = setup();
			const launchParams: IToolLaunchParams = {
				externalToolDO,
				schoolExternalToolDO,
				contextExternalToolDO,
			};
			externalToolDO.parameters = [globalCustomParameter];
			schoolExternalToolDO.parameters = [];
			contextExternalToolDO.parameters = [];

			const result: ToolLaunchData = await launchStrategy.createLaunchData('userId', launchParams);

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

		it('should return a ToolLaunchDataDO with only school custom parameters', async () => {
			const {
				externalToolDO,
				schoolExternalToolDO,
				contextExternalToolDO,
				schoolCustomParameterAuto,
				schoolParameterEntry,
			} = setup();
			const launchParams: IToolLaunchParams = {
				externalToolDO,
				schoolExternalToolDO,
				contextExternalToolDO,
			};
			externalToolDO.parameters = [schoolCustomParameterAuto];
			schoolExternalToolDO.parameters = [schoolParameterEntry];
			contextExternalToolDO.parameters = [];

			const result: ToolLaunchData = await launchStrategy.createLaunchData('userId', launchParams);

			expect(result).toEqual<ToolLaunchData>({
				baseUrl: launchParams.externalToolDO.config.baseUrl,
				type: ToolLaunchDataType.BASIC,
				openNewTab: false,
				properties: [
					{
						name: schoolCustomParameterAuto.name,
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

		it('should return a ToolLaunchDataDO with only context custom parameters', async () => {
			const {
				externalToolDO,
				schoolExternalToolDO,
				contextExternalToolDO,
				contextCustomParameterAuto,
				contextParameterEntry,
			} = setup();
			const launchParams: IToolLaunchParams = {
				externalToolDO,
				schoolExternalToolDO,
				contextExternalToolDO,
			};
			externalToolDO.parameters = [contextCustomParameterAuto];
			schoolExternalToolDO.parameters = [];
			contextExternalToolDO.parameters = [contextParameterEntry];

			const result: ToolLaunchData = await launchStrategy.createLaunchData('userId', launchParams);

			expect(result).toEqual<ToolLaunchData>({
				baseUrl: launchParams.externalToolDO.config.baseUrl,
				type: ToolLaunchDataType.BASIC,
				openNewTab: false,
				properties: [
					{
						name: contextCustomParameterAuto.name,
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
				baseUrl: 'https://www.basic-baseurl.com/pre/:pathParam/post',
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
