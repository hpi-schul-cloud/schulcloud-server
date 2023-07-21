import {
	ContextExternalToolDO,
	CustomParameterDO,
	CustomParameterEntryDO,
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	EntityId,
	ExternalToolDO,
	SchoolExternalToolDO,
} from '@shared/domain';
import { URLSearchParams } from 'url';
import { ToolContextType } from '../../../common/interface';
import { ToolLaunchMapper } from '../../mapper';
import { LaunchRequestMethod, PropertyData, PropertyLocation, ToolLaunchData, ToolLaunchRequest } from '../../types';
import { IToolLaunchParams } from './tool-launch-params.interface';
import { IToolLaunchStrategy } from './tool-launch-strategy.interface';

export abstract class AbstractLaunchStrategy implements IToolLaunchStrategy {
	public async createLaunchData(userId: EntityId, data: IToolLaunchParams): Promise<ToolLaunchData> {
		const launchData: ToolLaunchData = this.buildToolLaunchDataFromExternalTool(data.externalToolDO);
		const launchDataProperties: PropertyData[] = this.buildToolLaunchDataFromTools(data);
		const additionalLaunchDataProperties: PropertyData[] = await this.buildToolLaunchDataFromConcreteConfig(
			userId,
			data
		);

		launchData.properties.push(...launchDataProperties);
		launchData.properties.push(...additionalLaunchDataProperties);

		return launchData;
	}

	public abstract buildToolLaunchDataFromConcreteConfig(
		userId: EntityId,
		config: IToolLaunchParams
	): Promise<PropertyData[]>;

	public abstract buildToolLaunchRequestPayload(url: string, properties: PropertyData[]): string | null;

	public abstract determineLaunchRequestMethod(properties: PropertyData[]): LaunchRequestMethod;

	public createLaunchRequest(toolLaunchData: ToolLaunchData): ToolLaunchRequest {
		const requestMethod: LaunchRequestMethod = this.determineLaunchRequestMethod(toolLaunchData.properties);
		const url: string = this.buildUrl(toolLaunchData);
		const payload: string | null = this.buildToolLaunchRequestPayload(url, toolLaunchData.properties);

		const toolLaunchRequest: ToolLaunchRequest = new ToolLaunchRequest({
			method: requestMethod,
			url,
			payload: payload ?? undefined,
			openNewTab: toolLaunchData.openNewTab,
		});

		return toolLaunchRequest;
	}

	private buildUrl(toolLaunchDataDO: ToolLaunchData): string {
		const { baseUrl } = toolLaunchDataDO;

		const pathProperties: PropertyData[] = toolLaunchDataDO.properties.filter(
			(property: PropertyData) => property.location === PropertyLocation.PATH
		);
		const queryProperties: PropertyData[] = toolLaunchDataDO.properties.filter(
			(property: PropertyData) => property.location === PropertyLocation.QUERY
		);

		const url = new URL(baseUrl);

		if (pathProperties.length > 0) {
			this.applyPropertiesToPathParams(url, pathProperties);
		}

		if (queryProperties.length > 0) {
			const queryParams: URLSearchParams = new URLSearchParams();
			queryProperties.forEach((property: PropertyData) => queryParams.append(property.name, property.value));

			url.search += queryParams.toString();
		}

		return url.toString();
	}

	private applyPropertiesToPathParams(url: URL, pathProperties: PropertyData[]): void {
		const trimSlash: string = url.pathname.replace(/(^\/)|(\/$)/g, '');
		const pathParams: string[] = trimSlash.split('/');

		const filledPathParams: string[] = pathParams.map((param: string): string => {
			let pathParam: string = param;

			if (param.startsWith(':')) {
				const foundProperty: PropertyData | undefined = pathProperties.find(
					(property: PropertyData) => param === `:${property.name}`
				);

				if (foundProperty) {
					pathParam = foundProperty.value;
				}
			}

			return pathParam;
		});

		url.pathname = filledPathParams.join('/');
	}

	private buildToolLaunchDataFromExternalTool(externalToolDO: ExternalToolDO): ToolLaunchData {
		const launchData = new ToolLaunchData({
			baseUrl: externalToolDO.config.baseUrl,
			type: ToolLaunchMapper.mapToToolLaunchDataType(externalToolDO.config.type),
			properties: [],
			openNewTab: externalToolDO.openNewTab,
		});

		return launchData;
	}

	private buildToolLaunchDataFromTools(data: IToolLaunchParams): PropertyData[] {
		const propertyData: PropertyData[] = [];
		const { externalToolDO, schoolExternalToolDO, contextExternalToolDO } = data;
		const customParameters = externalToolDO.parameters || [];

		const scopes: { scope: CustomParameterScope; params: CustomParameterEntryDO[] }[] = [
			{ scope: CustomParameterScope.GLOBAL, params: customParameters },
			{ scope: CustomParameterScope.SCHOOL, params: schoolExternalToolDO.parameters || [] },
			{ scope: CustomParameterScope.CONTEXT, params: contextExternalToolDO.parameters || [] },
		];

		this.addParameters(propertyData, customParameters, scopes, schoolExternalToolDO, contextExternalToolDO);

		return propertyData;
	}

	private addParameters(
		propertyData: PropertyData[],
		customParameterDOs: CustomParameterDO[],
		scopes: { scope: CustomParameterScope; params: CustomParameterEntryDO[] }[],
		schoolExternalToolDO: SchoolExternalToolDO,
		contextExternalToolDO: ContextExternalToolDO
	): void {
		for (const { scope, params } of scopes) {
			const parameterNames: string[] = params.map((parameter: CustomParameterEntryDO) => parameter.name);

			const parametersToInclude: CustomParameterDO[] = customParameterDOs.filter(
				(parameter: CustomParameterDO) => parameter.scope === scope && parameterNames.includes(parameter.name)
			);

			this.handleParametersToInclude(
				parametersToInclude,
				params,
				propertyData,
				schoolExternalToolDO,
				contextExternalToolDO
			);
		}
	}

	private handleParametersToInclude(
		parametersToInclude: CustomParameterDO[],
		params: CustomParameterEntryDO[],
		propertyData: PropertyData[],
		schoolExternalToolDO: SchoolExternalToolDO,
		contextExternalToolDO: ContextExternalToolDO
	): void {
		for (const parameter of parametersToInclude) {
			const matchingParameter: CustomParameterEntryDO | undefined = params.find(
				(param: CustomParameterEntryDO) => param.name === parameter.name
			);

			if (matchingParameter) {
				const value = this.getParameterValue(parameter, matchingParameter, schoolExternalToolDO, contextExternalToolDO);

				if (value !== undefined) {
					this.addProperty(propertyData, parameter.name, value, parameter.location);
				}
			}
		}
	}

	private getParameterValue(
		customParameter: CustomParameterDO,
		matchingParameterEntry: CustomParameterEntryDO,
		schoolExternalToolDO: SchoolExternalToolDO,
		contextExternalToolDO: ContextExternalToolDO
	): string | undefined {
		if (customParameter.type === CustomParameterType.AUTO_SCHOOLID) {
			return schoolExternalToolDO.schoolId;
		}

		if (
			customParameter.type === CustomParameterType.AUTO_CONTEXTID &&
			contextExternalToolDO.contextRef.type === ToolContextType.COURSE
		) {
			return contextExternalToolDO.contextRef.id;
		}

		const parameterValue =
			customParameter.scope === CustomParameterScope.GLOBAL ? customParameter.default : matchingParameterEntry.value;

		return parameterValue;
	}

	private addProperty(
		propertyData: PropertyData[],
		propertyName: string,
		value: string | undefined,
		customParameterLocation: CustomParameterLocation
	): void {
		const location: PropertyLocation = ToolLaunchMapper.mapToParameterLocation(customParameterLocation);

		if (value) {
			propertyData.push({
				name: propertyName,
				value,
				location,
			});
		}
	}
}
