import { CustomParameterLocation, ToolConfigType } from '@shared/domain';
import { PropertyLocation, ToolLaunchDataType, ToolLaunchRequest } from '../types';
import { ToolLaunchRequestResponse } from '../controller/dto/tool-launch-request.response';

const customToParameterLocationMapping: Record<CustomParameterLocation, PropertyLocation> = {
	[CustomParameterLocation.PATH]: PropertyLocation.PATH,
	[CustomParameterLocation.BODY]: PropertyLocation.BODY,
	[CustomParameterLocation.QUERY]: PropertyLocation.QUERY,
};

const toolConfigTypeToToolLaunchDataTypeMapping: Record<ToolConfigType, ToolLaunchDataType> = {
	[ToolConfigType.BASIC]: ToolLaunchDataType.BASIC,
	[ToolConfigType.LTI11]: ToolLaunchDataType.LTI11,
	[ToolConfigType.OAUTH2]: ToolLaunchDataType.OAUTH2,
};

const toolLaunchDataTypeToToolConfigTypeMapping: Record<ToolLaunchDataType, ToolConfigType> = Object.entries(
	toolConfigTypeToToolLaunchDataTypeMapping
).reduce((acc: Record<ToolLaunchDataType, ToolConfigType>, [key, value]) => {
	return { ...acc, [value]: key as ToolConfigType };
}, {} as Record<ToolLaunchDataType, ToolConfigType>);

export class ToolLaunchMapper {
	static mapToParameterLocation(location: CustomParameterLocation): PropertyLocation {
		const mappedLocation = customToParameterLocationMapping[location];
		return mappedLocation;
	}

	static mapToToolLaunchDataType(configType: ToolConfigType): ToolLaunchDataType {
		const mappedType = toolConfigTypeToToolLaunchDataTypeMapping[configType];
		return mappedType;
	}

	static mapToToolConfigType(launchDataType: ToolLaunchDataType): ToolConfigType {
		const mappedType = toolLaunchDataTypeToToolConfigTypeMapping[launchDataType];
		return mappedType;
	}

	static mapToToolLaunchRequestResponse(toolLaunchRequest: ToolLaunchRequest): ToolLaunchRequestResponse {
		const { method, url, payload, openNewTab } = toolLaunchRequest;

		const response = new ToolLaunchRequestResponse({
			method,
			url,
			payload,
			openNewTab,
		});
		return response;
	}
}
