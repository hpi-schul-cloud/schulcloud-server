import {
	ContextExternalToolDO,
	CustomParameterDO,
	CustomParameterEntryDO,
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	ExternalToolConfigDO,
	ExternalToolDO,
	SchoolExternalToolDO,
} from '@shared/domain';
import { URLSearchParams } from 'url';
import { LaunchRequestMethod, PropertyData, PropertyLocation, ToolLaunchData, ToolLaunchRequest } from '../../types';
import { IToolLaunchParams } from './tool-launch-params.interface';
import { ToolLaunchMapper } from '../../mapper';
import { ToolContextType } from '../../../interface';

export abstract class AbstractLaunchStrategy {
	public createLaunchData(data: IToolLaunchParams): ToolLaunchData {
		const launchData: ToolLaunchData = this.buildToolLaunchDataFromExternalTool(data.externalToolDO);
		launchData.properties.push(...this.buildToolLaunchDataFromTools(data));
		launchData.properties.push(...this.buildToolLaunchDataFromConcreteConfig(data.externalToolDO.config));

		return launchData;
	}

	protected abstract buildToolLaunchDataFromConcreteConfig(config: ExternalToolConfigDO): PropertyData[];

	protected abstract buildToolLaunchRequestPayload(properties: PropertyData[]): string;

	public createLaunchRequest(toolLaunchDataDO: ToolLaunchData): ToolLaunchRequest {
		const requestMethod: LaunchRequestMethod = this.determineLaunchRequestMethod(toolLaunchDataDO.properties);
		const url: string = this.buildUrl(toolLaunchDataDO);
		const payload: string = this.buildToolLaunchRequestPayload(toolLaunchDataDO.properties);

		const toolLaunchRequestDO: ToolLaunchRequest = new ToolLaunchRequest({
			method: requestMethod,
			url,
			payload,
			openNewTab: toolLaunchDataDO.openNewTab,
		});

		return toolLaunchRequestDO;
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
			const pathParams: string = pathProperties.map((property: PropertyData) => `${property.value}`).join('/');
			url.pathname = url.pathname.endsWith('/') ? `${url.pathname}${pathParams}` : `${url.pathname}/${pathParams}`;
		}

		if (queryProperties.length > 0) {
			const queryParams: URLSearchParams = new URLSearchParams();
			queryProperties.forEach((property: PropertyData) => queryParams.append(property.name, property.value));

			url.search += queryParams.toString();
		}

		const urlString = url.toString();
		return urlString;
	}

	private determineLaunchRequestMethod(properties: PropertyData[]): LaunchRequestMethod {
		const hasBodyProperty: boolean = properties.some(
			(property: PropertyData) => property.location === PropertyLocation.BODY
		);

		const launchRequestMethod: LaunchRequestMethod = hasBodyProperty
			? LaunchRequestMethod.POST
			: LaunchRequestMethod.GET;

		return launchRequestMethod;
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
			customParameter.type === CustomParameterType.AUTO_COURSEID &&
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
