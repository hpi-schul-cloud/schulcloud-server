import { CustomParameterLocation } from '../../common/enum/custom-parameter-location.enum';
import { ToolConfigType } from '../../common/enum/tool-config-type.enum';
import { ToolLaunchRequestResponse } from '../controller/dto/tool-launch-request.response';
import { PropertyLocation } from '../types/property-location';
import { ToolLaunchDataType } from '../types/tool-launch-data-type';
import { ToolLaunchRequest } from '../types/tool-launch-request';

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

const toolLaunchDataTypeToToolConfigTypeMapping: Record<ToolLaunchDataType, ToolConfigType> = {
	[ToolLaunchDataType.BASIC]: ToolConfigType.BASIC,
	[ToolLaunchDataType.LTI11]: ToolConfigType.LTI11,
	[ToolLaunchDataType.OAUTH2]: ToolConfigType.OAUTH2,
};

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
