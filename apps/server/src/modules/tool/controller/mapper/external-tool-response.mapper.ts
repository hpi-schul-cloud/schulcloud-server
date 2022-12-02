import { Injectable } from '@nestjs/common';
import {
	BasicToolConfigDO,
	CustomParameterDO,
	ExternalToolDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/external-tool';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '@shared/domain';
import { CustomParameterLocationParams, CustomParameterScopeParams, CustomParameterTypeParams } from '../../interface';
import {
	BasicToolConfigResponse,
	CustomParameterResponse,
	ExternalToolResponse,
	Lti11ToolConfigResponse,
	Oauth2ToolConfigResponse,
} from '../dto';

const scopeMapping: Record<CustomParameterScope, CustomParameterScopeParams> = {
	[CustomParameterScope.GLOBAL]: CustomParameterScopeParams.GLOBAL,
	[CustomParameterScope.COURSE]: CustomParameterScopeParams.COURSE,
	[CustomParameterScope.SCHOOL]: CustomParameterScopeParams.SCHOOL,
};

const locationMapping: Record<CustomParameterLocation, CustomParameterLocationParams> = {
	[CustomParameterLocation.PATH]: CustomParameterLocationParams.PATH,
	[CustomParameterLocation.QUERY]: CustomParameterLocationParams.QUERY,
	[CustomParameterLocation.TOKEN]: CustomParameterLocationParams.TOKEN,
};

const typeMapping: Record<CustomParameterType, CustomParameterTypeParams> = {
	[CustomParameterType.STRING]: CustomParameterTypeParams.STRING,
	[CustomParameterType.BOOLEAN]: CustomParameterTypeParams.BOOLEAN,
	[CustomParameterType.NUMBER]: CustomParameterTypeParams.NUMBER,
	[CustomParameterType.AUTO_COURSEID]: CustomParameterTypeParams.AUTO_COURSEID,
	[CustomParameterType.AUTO_COURSENAME]: CustomParameterTypeParams.AUTO_COURSENAME,
	[CustomParameterType.AUTO_SCHOOLID]: CustomParameterTypeParams.AUTO_SCHOOLID,
};

@Injectable()
export class ExternalToolResponseMapper {
	mapToResponse(externalToolDO: ExternalToolDO): ExternalToolResponse {
		let mappedConfig: BasicToolConfigResponse | Lti11ToolConfigResponse | Oauth2ToolConfigResponse;
		if (externalToolDO.config instanceof BasicToolConfigDO) {
			mappedConfig = this.mapBasicToolConfigDOToResponse(externalToolDO.config);
		} else if (externalToolDO.config instanceof Lti11ToolConfigDO) {
			mappedConfig = this.mapLti11ToolConfigDOToResponse(externalToolDO.config);
		} else {
			mappedConfig = this.mapOauth2ToolConfigDOToResponse(externalToolDO.config);
		}

		const mappedCustomParameter: CustomParameterResponse[] = this.mapCustomParameterDOToResponse(
			externalToolDO.parameters ?? []
		);

		return new ExternalToolResponse({
			id: externalToolDO.id || '',
			name: externalToolDO.name,
			url: externalToolDO.url,
			logoUrl: externalToolDO.logoUrl,
			config: mappedConfig,
			parameters: mappedCustomParameter,
			isHidden: externalToolDO.isHidden,
			openNewTab: externalToolDO.openNewTab,
			version: externalToolDO.version,
		});
	}

	private mapBasicToolConfigDOToResponse(externalToolConfigDO: BasicToolConfigDO): BasicToolConfigResponse {
		return new BasicToolConfigResponse({ ...externalToolConfigDO });
	}

	private mapLti11ToolConfigDOToResponse(externalToolConfigDO: Lti11ToolConfigDO): Lti11ToolConfigResponse {
		return new Lti11ToolConfigResponse({ ...externalToolConfigDO });
	}

	private mapOauth2ToolConfigDOToResponse(externalToolConfigDO: Oauth2ToolConfigDO): Oauth2ToolConfigResponse {
		return new Oauth2ToolConfigResponse({ ...externalToolConfigDO });
	}

	private mapCustomParameterDOToResponse(customParameterDOS: CustomParameterDO[]): CustomParameterResponse[] {
		return customParameterDOS.map((customParameterDO: CustomParameterDO) => {
			return {
				name: customParameterDO.name,
				default: customParameterDO.default,
				regex: customParameterDO.regex,
				scope: scopeMapping[customParameterDO.scope],
				location: locationMapping[customParameterDO.location],
				type: typeMapping[customParameterDO.type],
			};
		});
	}
}
