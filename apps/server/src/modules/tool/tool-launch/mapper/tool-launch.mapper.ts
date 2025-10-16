import { CustomParameterLocation, ToolConfigType } from '../../common/enum';
import { ToolLaunchRequestResponse } from '../controller/dto';
import { PropertyLocation, ToolLaunchDataType, ToolLaunchRequest } from '../types';

const customToParameterLocationMapping: Record<CustomParameterLocation, PropertyLocation> = {
	[CustomParameterLocation.PATH]: PropertyLocation.PATH,
	[CustomParameterLocation.BODY]: PropertyLocation.BODY,
	[CustomParameterLocation.QUERY]: PropertyLocation.QUERY,
	[CustomParameterLocation.FRAGMENT]: PropertyLocation.FRAGMENT,
};

const toolConfigTypeToToolLaunchDataTypeMapping: Record<ToolConfigType, ToolLaunchDataType> = {
	[ToolConfigType.BASIC]: ToolLaunchDataType.BASIC,
	[ToolConfigType.LTI11]: ToolLaunchDataType.LTI11,
	[ToolConfigType.OAUTH2]: ToolLaunchDataType.OAUTH2,
};

export class ToolLaunchMapper {
	public static mapToParameterLocation(location: CustomParameterLocation): PropertyLocation {
		const mappedLocation = customToParameterLocationMapping[location];

		return mappedLocation;
	}

	public static mapToToolLaunchDataType(configType: ToolConfigType): ToolLaunchDataType {
		const mappedType = toolConfigTypeToToolLaunchDataTypeMapping[configType];

		return mappedType;
	}

	public static mapToToolLaunchRequestResponse(toolLaunchRequest: ToolLaunchRequest): ToolLaunchRequestResponse {
		const response = new ToolLaunchRequestResponse(toolLaunchRequest);

		return response;
	}
}
