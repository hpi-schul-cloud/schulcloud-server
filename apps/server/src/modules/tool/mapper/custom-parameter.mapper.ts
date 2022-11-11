import { Injectable } from '@nestjs/common';

import { CustomParameterScopeParams } from '@src/modules/tool/interface/custom-parameter-scope.enum';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '@shared/domain';
import { CustomParameterLocationParams } from '@src/modules/tool/interface/custom-parameter-location.enum';
import { CustomParameterTypeParams } from '@src/modules/tool/interface/custom-parameter-type.enum';

const scopeMapping: Record<CustomParameterScopeParams, CustomParameterScope> = {
	[CustomParameterScopeParams.COURSE]: CustomParameterScope.COURSE,
	[CustomParameterScopeParams.SCHOOL]: CustomParameterScope.SCHOOL,
};

const locationMapping: Partial<Record<CustomParameterLocationParams, CustomParameterLocation>> = {
	[CustomParameterLocationParams.PATH]: CustomParameterLocation.PATH,
	[CustomParameterLocationParams.QUERY]: CustomParameterLocation.QUERY,
	[CustomParameterLocationParams.TOKEN]: CustomParameterLocation.TOKEN,
};

const typeMapping: Partial<Record<CustomParameterTypeParams, CustomParameterType>> = {
	[CustomParameterTypeParams.STRING]: CustomParameterType.STRING,
	[CustomParameterTypeParams.BOOLEAN]: CustomParameterType.BOOLEAN,
	[CustomParameterTypeParams.NUMBER]: CustomParameterType.NUMBER,
	[CustomParameterTypeParams.AUTO_COURSEID]: CustomParameterType.AUTO_COURSEID,
	[CustomParameterTypeParams.AUTO_COURSENAME]: CustomParameterType.AUTO_COURSENAME,
	[CustomParameterTypeParams.AUTO_SCHOOLID]: CustomParameterType.AUTO_SCHOOLID,
};

@Injectable()
export class CustomParameterMapper {
	mapScope(customParameterParamsScope: CustomParameterScopeParams): CustomParameterScope {
		return scopeMapping[customParameterParamsScope];
	}

	mapLocation(customParameterScopeParams: CustomParameterLocationParams): CustomParameterLocation | undefined {
		return locationMapping[customParameterScopeParams];
	}

	mapType(customParameterTypeParams: CustomParameterTypeParams): CustomParameterType | undefined {
		return typeMapping[customParameterTypeParams];
	}
}
