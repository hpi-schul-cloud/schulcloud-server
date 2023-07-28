import { Injectable } from '@nestjs/common';
import { Course, EntityId, SchoolDO } from '@shared/domain';
import { CourseRepo } from '@shared/repo';
import { SchoolService } from '@src/modules/school';
import { URLSearchParams } from 'url';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	ToolContextType,
} from '../../../common/enum';
import { MissingToolParameterValueLoggableException, ParameterTypeNotImplementedLoggableException } from '../../error';
import { ToolLaunchMapper } from '../../mapper';
import { LaunchRequestMethod, PropertyData, PropertyLocation, ToolLaunchData, ToolLaunchRequest } from '../../types';
import { IToolLaunchParams } from './tool-launch-params.interface';
import { IToolLaunchStrategy } from './tool-launch-strategy.interface';
import { SchoolExternalToolDO } from '../../../school-external-tool/domain';
import { CustomParameterDO, CustomParameterEntryDO } from '../../../common/domain';
import { ContextExternalTool } from '../../../context-external-tool/domain';
import { ExternalToolDO } from '../../../external-tool/domain';

@Injectable()
export abstract class AbstractLaunchStrategy implements IToolLaunchStrategy {
	constructor(private readonly schoolService: SchoolService, private readonly courseRepo: CourseRepo) {}

	public async createLaunchData(userId: EntityId, data: IToolLaunchParams): Promise<ToolLaunchData> {
		const launchData: ToolLaunchData = this.buildToolLaunchDataFromExternalTool(data.externalToolDO);

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

	private async buildToolLaunchDataFromTools(data: IToolLaunchParams): Promise<PropertyData[]> {
		const propertyData: PropertyData[] = [];
		const { externalToolDO, schoolExternalToolDO, contextExternalToolDO } = data;
		const customParameters = externalToolDO.parameters || [];

		const scopes: { scope: CustomParameterScope; params: CustomParameterEntryDO[] }[] = [
			{ scope: CustomParameterScope.GLOBAL, params: customParameters },
			{ scope: CustomParameterScope.SCHOOL, params: schoolExternalToolDO.parameters || [] },
			{ scope: CustomParameterScope.CONTEXT, params: contextExternalToolDO.parameters || [] },
		];

		await this.addParameters(propertyData, customParameters, scopes, schoolExternalToolDO, contextExternalToolDO);

		return propertyData;
	}

	private async addParameters(
		propertyData: PropertyData[],
		customParameterDOs: CustomParameterDO[],
		scopes: { scope: CustomParameterScope; params: CustomParameterEntryDO[] }[],
		schoolExternalToolDO: SchoolExternalToolDO,
		contextExternalTool: ContextExternalTool
	): Promise<void> {
		await Promise.all(
			scopes.map(async ({ scope, params }): Promise<void> => {
				const parameterNames: string[] = params.map((parameter: CustomParameterEntryDO) => parameter.name);

				const parametersToInclude: CustomParameterDO[] = customParameterDOs.filter(
					(parameter: CustomParameterDO) => parameter.scope === scope && parameterNames.includes(parameter.name)
				);

				await this.handleParametersToInclude(
					propertyData,
					parametersToInclude,
					params,
					schoolExternalToolDO,
					contextExternalTool
				);
			})
		);
	}

	private async handleParametersToInclude(
		propertyData: PropertyData[],
		parametersToInclude: CustomParameterDO[],
		params: CustomParameterEntryDO[],
		schoolExternalToolDO: SchoolExternalToolDO,
		contextExternalTool: ContextExternalTool
	): Promise<void> {
		const missingParameters: CustomParameterDO[] = [];

		await Promise.all(
			parametersToInclude.map(async (parameter): Promise<void> => {
				const matchingParameter: CustomParameterEntryDO | undefined = params.find(
					(param: CustomParameterEntryDO) => param.name === parameter.name
				);

				const value: string | undefined = await this.getParameterValue(
					parameter,
					matchingParameter,
					schoolExternalToolDO,
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
		customParameter: CustomParameterDO,
		matchingParameterEntry: CustomParameterEntryDO | undefined,
		schoolExternalToolDO: SchoolExternalToolDO,
		contextExternalTool: ContextExternalTool
	): Promise<string | undefined> {
		switch (customParameter.type) {
			case CustomParameterType.AUTO_SCHOOLID: {
				return schoolExternalToolDO.schoolId;
			}
			case CustomParameterType.AUTO_CONTEXTID: {
				return contextExternalTool.contextRef.id;
			}
			case CustomParameterType.AUTO_CONTEXTNAME: {
				if (contextExternalTool.contextRef.type === ToolContextType.COURSE) {
					const course: Course = await this.courseRepo.findById(contextExternalTool.contextRef.id);

					return course.name;
				}

				throw new ParameterTypeNotImplementedLoggableException(
					`${customParameter.type}/${contextExternalTool.contextRef.type as string}`
				);
			}
			case CustomParameterType.AUTO_SCHOOLNUMBER: {
				const school: SchoolDO = await this.schoolService.getSchoolById(schoolExternalToolDO.schoolId);

				return school.officialSchoolNumber;
			}
			case CustomParameterType.BOOLEAN:
			case CustomParameterType.NUMBER:
			case CustomParameterType.STRING: {
				return customParameter.scope === CustomParameterScope.GLOBAL
					? customParameter.default
					: matchingParameterEntry?.value;
			}
			default: {
				throw new ParameterTypeNotImplementedLoggableException(customParameter.type);
			}
		}
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
