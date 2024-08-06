import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { URLSearchParams } from 'url';
import { CustomParameter, CustomParameterEntry } from '../../../common/domain';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '../../../common/enum';
import { ContextExternalToolLaunchable } from '../../../context-external-tool/domain';
import { ExternalTool } from '../../../external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { MissingToolParameterValueLoggableException, ParameterTypeNotImplementedLoggableException } from '../../error';
import { ToolLaunchMapper } from '../../mapper';
import { LaunchRequestMethod, PropertyData, PropertyLocation, ToolLaunchData, ToolLaunchRequest } from '../../types';
import {
	AutoContextIdStrategy,
	AutoContextNameStrategy,
	AutoMediumIdStrategy,
	AutoParameterStrategy,
	AutoSchoolIdStrategy,
	AutoSchoolNumberStrategy,
	AutoGroupExternalUuidStrategy,
} from '../auto-parameter-strategy';
import { ToolLaunchParams } from './tool-launch-params.interface';
import { ToolLaunchStrategy } from './tool-launch-strategy.interface';

@Injectable()
export abstract class AbstractLaunchStrategy implements ToolLaunchStrategy {
	private readonly autoParameterStrategyMap: Map<CustomParameterType, AutoParameterStrategy>;

	constructor(
		autoSchoolIdStrategy: AutoSchoolIdStrategy,
		autoSchoolNumberStrategy: AutoSchoolNumberStrategy,
		autoContextIdStrategy: AutoContextIdStrategy,
		autoContextNameStrategy: AutoContextNameStrategy,
		autoMediumIdStrategy: AutoMediumIdStrategy,
		autoGroupExternalUuidStrategy: AutoGroupExternalUuidStrategy
	) {
		this.autoParameterStrategyMap = new Map<CustomParameterType, AutoParameterStrategy>([
			[CustomParameterType.AUTO_SCHOOLID, autoSchoolIdStrategy],
			[CustomParameterType.AUTO_SCHOOLNUMBER, autoSchoolNumberStrategy],
			[CustomParameterType.AUTO_CONTEXTID, autoContextIdStrategy],
			[CustomParameterType.AUTO_CONTEXTNAME, autoContextNameStrategy],
			[CustomParameterType.AUTO_MEDIUMID, autoMediumIdStrategy],
			[CustomParameterType.AUTO_GROUP_EXTERNALUUID, autoGroupExternalUuidStrategy],
		]);
	}

	public async createLaunchData(userId: EntityId, data: ToolLaunchParams): Promise<ToolLaunchData> {
		const launchData: ToolLaunchData = this.buildToolLaunchDataFromExternalTool(data.externalTool);

		const launchDataProperties: PropertyData[] = await this.buildToolLaunchDataFromTools(data);
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
		config: ToolLaunchParams
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

	private buildToolLaunchDataFromExternalTool(externalTool: ExternalTool): ToolLaunchData {
		const launchData = new ToolLaunchData({
			baseUrl: externalTool.config.baseUrl,
			type: ToolLaunchMapper.mapToToolLaunchDataType(externalTool.config.type),
			properties: [],
			openNewTab: externalTool.openNewTab,
		});

		return launchData;
	}

	private async buildToolLaunchDataFromTools(data: ToolLaunchParams): Promise<PropertyData[]> {
		const propertyData: PropertyData[] = [];
		const { externalTool, schoolExternalTool, contextExternalTool } = data;
		const customParameters = externalTool.parameters || [];

		const scopes: { scope: CustomParameterScope; params: CustomParameterEntry[] }[] = [
			{ scope: CustomParameterScope.GLOBAL, params: customParameters },
			{ scope: CustomParameterScope.SCHOOL, params: schoolExternalTool.parameters || [] },
			{ scope: CustomParameterScope.CONTEXT, params: contextExternalTool.parameters || [] },
		];

		await this.addParameters(propertyData, customParameters, scopes, schoolExternalTool, contextExternalTool);

		return propertyData;
	}

	private async addParameters(
		propertyData: PropertyData[],
		customParameterDOs: CustomParameter[],
		scopes: { scope: CustomParameterScope; params: CustomParameterEntry[] }[],
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalToolLaunchable
	): Promise<void> {
		await Promise.all(
			scopes.map(async ({ scope, params }): Promise<void> => {
				const parameterNames: string[] = params.map((parameter: CustomParameterEntry) => parameter.name);

				const parametersToInclude: CustomParameter[] = customParameterDOs.filter(
					(parameter: CustomParameter) => parameter.scope === scope && parameterNames.includes(parameter.name)
				);

				await this.handleParametersToInclude(
					propertyData,
					parametersToInclude,
					params,
					schoolExternalTool,
					contextExternalTool
				);
			})
		);
	}

	private async handleParametersToInclude(
		propertyData: PropertyData[],
		parametersToInclude: CustomParameter[],
		params: CustomParameterEntry[],
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalToolLaunchable
	): Promise<void> {
		const missingParameters: CustomParameter[] = [];

		await Promise.all(
			parametersToInclude.map(async (parameter): Promise<void> => {
				const matchingParameter: CustomParameterEntry | undefined = params.find(
					(param: CustomParameterEntry) => param.name === parameter.name
				);

				const value: string | undefined = await this.getParameterValue(
					parameter,
					matchingParameter,
					schoolExternalTool,
					contextExternalTool
				);

				if (value !== undefined) {
					this.addProperty(propertyData, parameter.name, value, parameter.location);
				}

				if (value === undefined && !parameter.isOptional) {
					missingParameters.push(parameter);
				}
			})
		);

		if (missingParameters.length > 0) {
			throw new MissingToolParameterValueLoggableException(contextExternalTool, missingParameters);
		}
	}

	private async getParameterValue(
		customParameter: CustomParameter,
		matchingParameterEntry: CustomParameterEntry | undefined,
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalToolLaunchable
	): Promise<string | undefined> {
		if (
			customParameter.type === CustomParameterType.BOOLEAN ||
			customParameter.type === CustomParameterType.NUMBER ||
			customParameter.type === CustomParameterType.STRING
		) {
			return customParameter.scope === CustomParameterScope.GLOBAL
				? customParameter.default
				: matchingParameterEntry?.value;
		}

		const autoParameterStrategy: AutoParameterStrategy | undefined = this.autoParameterStrategyMap.get(
			customParameter.type
		);
		if (autoParameterStrategy) {
			const autoValue: string | undefined = await autoParameterStrategy.getValue(
				schoolExternalTool,
				contextExternalTool
			);

			return autoValue;
		}

		throw new ParameterTypeNotImplementedLoggableException(customParameter.type);
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
