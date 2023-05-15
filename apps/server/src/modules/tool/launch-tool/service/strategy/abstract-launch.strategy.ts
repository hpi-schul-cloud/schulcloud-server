import {
	LaunchRequestMethod,
	PropertyDataDO,
	PropertyLocation,
	ToolLaunchDataDO,
	ToolLaunchRequestDO,
} from '@shared/domain/domainobject/tool/launch';
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
import { IToolLaunchParams } from './tool-launch-params.interface';
import { ToolLaunchMapper } from '../../mapper/tool-launch.mapper';
import { ToolContextType } from '../../../interface';

export abstract class AbstractLaunchStrategy {
	public createLaunchData(data: IToolLaunchParams): ToolLaunchDataDO {
		const launchData: ToolLaunchDataDO = this.buildToolLaunchDataFromExternalTool(data.externalToolDO);
		launchData.properties.push(...this.buildToolLaunchDataFromTools(data));
		launchData.properties.push(...this.buildToolLaunchDataFromConcreteConfig(data.config));

		return launchData;
	}

	protected abstract buildToolLaunchDataFromConcreteConfig(config: ExternalToolConfigDO): PropertyDataDO[];

	protected abstract buildToolLaunchRequestPayload(properties: PropertyDataDO[]): string;

	public createLaunchRequest(toolLaunchDataDO: ToolLaunchDataDO): ToolLaunchRequestDO {
		const requestMethod: LaunchRequestMethod = this.determineLaunchRequestMethod(toolLaunchDataDO.properties);
		const url: string = this.buildUrl(toolLaunchDataDO);
		const payload: string = this.buildToolLaunchRequestPayload(toolLaunchDataDO.properties);

		const toolLaunchRequestDO: ToolLaunchRequestDO = {
			method: requestMethod,
			url,
			payload,
			openNewTab: toolLaunchDataDO.openNewTab,
		};

		return toolLaunchRequestDO;
	}

	private buildUrl(toolLaunchDataDO: ToolLaunchDataDO): string {
		const { baseUrl } = toolLaunchDataDO;

		const pathProperties: PropertyDataDO[] = toolLaunchDataDO.properties.filter(
			(property: PropertyDataDO) => property.location === PropertyLocation.PATH
		);
		const queryProperties: PropertyDataDO[] = toolLaunchDataDO.properties.filter(
			(property: PropertyDataDO) => property.location === PropertyLocation.QUERY
		);

		const url = new URL(baseUrl);

		if (pathProperties.length > 0) {
			const pathParams: string = pathProperties.map((property: PropertyDataDO) => `${property.value}`).join('/');
			url.pathname = url.pathname.endsWith('/') ? `${url.pathname}${pathParams}` : `${url.pathname}/${pathParams}`;
		}

		if (queryProperties.length > 0) {
			const queryParams: string = queryProperties
				.map((property: PropertyDataDO) => `${property.name}=${property.value}`)
				.join('&');
			url.search += `?${queryParams}`;
		}

		const urlString = url.toString();
		return urlString;
	}

	private determineLaunchRequestMethod(properties: PropertyDataDO[]): LaunchRequestMethod {
		const hasBodyProperty: boolean = properties.some(
			(property: PropertyDataDO) => property.location === PropertyLocation.BODY
		);

		const launchRequestMethod: LaunchRequestMethod = hasBodyProperty
			? LaunchRequestMethod.POST
			: LaunchRequestMethod.GET;

		return launchRequestMethod;
	}

	private buildToolLaunchDataFromExternalTool(externalToolDO: ExternalToolDO): ToolLaunchDataDO {
		const launchData = new ToolLaunchDataDO({
			baseUrl: externalToolDO.config.baseUrl,
			type: ToolLaunchMapper.mapToToolLaunchDataType(externalToolDO.config.type),
			properties: [],
			openNewTab: externalToolDO.openNewTab,
		});

		return launchData;
	}

	private buildToolLaunchDataFromTools(data: IToolLaunchParams): PropertyDataDO[] {
		const propertyData: PropertyDataDO[] = [];
		const { externalToolDO, schoolExternalToolDO, contextExternalToolDO } = data;
		const externalParameters = externalToolDO.parameters || [];

		const scopes: { scope: CustomParameterScope; params: CustomParameterEntryDO[] }[] = [
			{ scope: CustomParameterScope.GLOBAL, params: externalToolDO.parameters || [] },
			{ scope: CustomParameterScope.SCHOOL, params: schoolExternalToolDO.parameters || [] },
			{ scope: CustomParameterScope.CONTEXT, params: contextExternalToolDO.parameters || [] },
		];

		this.addParameters(propertyData, externalParameters, scopes, schoolExternalToolDO, contextExternalToolDO);

		return propertyData;
	}

	private addParameters(
		propertyData: PropertyDataDO[],
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
		propertyData: PropertyDataDO[],
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
			contextExternalToolDO.contextType === ToolContextType.COURSE
		) {
			return contextExternalToolDO.contextId;
		}

		return customParameter.scope === CustomParameterScope.GLOBAL
			? customParameter.default
			: matchingParameterEntry.value;
	}

	private addProperty(
		propertyData: PropertyDataDO[],
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
