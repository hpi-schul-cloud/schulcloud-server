import { CustomParameterLocation, ToolConfigType, ToolLaunchRequestDO } from '@shared/domain';
import { PropertyLocation } from '@shared/domain/domainobject/tool/launch';
import { ToolLaunchDataType } from '@shared/domain/domainobject/tool/launch/tool-launch-data-type';
import { ToolLaunchRequestResponse } from './tool-launch-request.response';

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

export class ToolLaunchMapper {
	static mapToParameterLocation(location: CustomParameterLocation): PropertyLocation {
		const mappedLocation = customToParameterLocationMapping[location];
		return mappedLocation;
	}

	static mapToToolLaunchDataType(configType: ToolConfigType): ToolLaunchDataType {
		const mappedType = toolConfigTypeToToolLaunchDataTypeMapping[configType];
		return mappedType;
	}

	static mapToToolLaunchRequestResponse(toolLaunchRequestDO: ToolLaunchRequestDO): ToolLaunchRequestResponse {
		const { method, url, payload } = toolLaunchRequestDO;

		const response = new ToolLaunchRequestResponse({
			method,
			url,
			payload,
		});
		return response;
	}
}
