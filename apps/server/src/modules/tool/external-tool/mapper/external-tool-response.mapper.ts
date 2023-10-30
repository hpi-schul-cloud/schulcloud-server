import { Injectable } from '@nestjs/common';
import { CustomParameter } from '../../common/domain/custom-parameter.do';
import { CustomParameterLocation } from '../../common/enum/custom-parameter-location.enum';
import { CustomParameterScope } from '../../common/enum/custom-parameter-scope.enum';
import { CustomParameterType } from '../../common/enum/custom-parameter-type.enum';
import { CustomParameterLocationParams } from '../../common/enum/request-response/custom-parameter-location.enum';
import { CustomParameterScopeTypeParams } from '../../common/enum/request-response/custom-parameter-scope-type.enum';
import { CustomParameterTypeParams } from '../../common/enum/request-response/custom-parameter-type.enum';
import { BasicToolConfigResponse } from '../controller/dto/response/config/basic-tool-config.response';
import { Lti11ToolConfigResponse } from '../controller/dto/response/config/lti11-tool-config.response';
import { Oauth2ToolConfigResponse } from '../controller/dto/response/config/oauth2-tool-config.response';
import { CustomParameterResponse } from '../controller/dto/response/custom-parameter.response';
import { ExternalToolResponse } from '../controller/dto/response/external-tool.response';
import { BasicToolConfig } from '../domain/config/basic-tool-config.do';
import { Lti11ToolConfig } from '../domain/config/lti11-tool-config.do';
import { Oauth2ToolConfig } from '../domain/config/oauth2-tool-config.do';
import { ExternalTool } from '../domain/external-tool.do';

const scopeMapping: Record<CustomParameterScope, CustomParameterScopeTypeParams> = {
	[CustomParameterScope.GLOBAL]: CustomParameterScopeTypeParams.GLOBAL,
	[CustomParameterScope.SCHOOL]: CustomParameterScopeTypeParams.SCHOOL,
	[CustomParameterScope.CONTEXT]: CustomParameterScopeTypeParams.CONTEXT,
};

const locationMapping: Record<CustomParameterLocation, CustomParameterLocationParams> = {
	[CustomParameterLocation.PATH]: CustomParameterLocationParams.PATH,
	[CustomParameterLocation.QUERY]: CustomParameterLocationParams.QUERY,
	[CustomParameterLocation.BODY]: CustomParameterLocationParams.BODY,
};

const typeMapping: Record<CustomParameterType, CustomParameterTypeParams> = {
	[CustomParameterType.STRING]: CustomParameterTypeParams.STRING,
	[CustomParameterType.BOOLEAN]: CustomParameterTypeParams.BOOLEAN,
	[CustomParameterType.NUMBER]: CustomParameterTypeParams.NUMBER,
	[CustomParameterType.AUTO_CONTEXTID]: CustomParameterTypeParams.AUTO_CONTEXTID,
	[CustomParameterType.AUTO_CONTEXTNAME]: CustomParameterTypeParams.AUTO_CONTEXTNAME,
	[CustomParameterType.AUTO_SCHOOLID]: CustomParameterTypeParams.AUTO_SCHOOLID,
	[CustomParameterType.AUTO_SCHOOLNUMBER]: CustomParameterTypeParams.AUTO_SCHOOLNUMBER,
};

@Injectable()
export class ExternalToolResponseMapper {
	static mapToExternalToolResponse(externalTool: ExternalTool): ExternalToolResponse {
		let mappedConfig: BasicToolConfigResponse | Lti11ToolConfigResponse | Oauth2ToolConfigResponse;
		if (externalTool.config instanceof BasicToolConfig) {
			mappedConfig = this.mapBasicToolConfigDOToResponse(externalTool.config);
		} else if (externalTool.config instanceof Lti11ToolConfig) {
			mappedConfig = this.mapLti11ToolConfigDOToResponse(externalTool.config);
		} else {
			mappedConfig = this.mapOauth2ToolConfigDOToResponse(externalTool.config);
		}

		const mappedCustomParameter: CustomParameterResponse[] = this.mapCustomParameterToResponse(
			externalTool.parameters ?? []
		);

		return new ExternalToolResponse({
			id: externalTool.id ?? '',
			name: externalTool.name,
			url: externalTool.url,
			logoUrl: externalTool.logoUrl,
			config: mappedConfig,
			parameters: mappedCustomParameter,
			isHidden: externalTool.isHidden,
			openNewTab: externalTool.openNewTab,
			version: externalTool.version,
		});
	}

	private static mapBasicToolConfigDOToResponse(externalToolConfigDO: BasicToolConfig): BasicToolConfigResponse {
		return new BasicToolConfigResponse({ ...externalToolConfigDO });
	}

	private static mapLti11ToolConfigDOToResponse(externalToolConfigDO: Lti11ToolConfig): Lti11ToolConfigResponse {
		return new Lti11ToolConfigResponse({ ...externalToolConfigDO });
	}

	private static mapOauth2ToolConfigDOToResponse(externalToolConfigDO: Oauth2ToolConfig): Oauth2ToolConfigResponse {
		return new Oauth2ToolConfigResponse({ ...externalToolConfigDO });
	}

	static mapCustomParameterToResponse(customParameters: CustomParameter[]): CustomParameterResponse[] {
		return customParameters.map((customParameterDO: CustomParameter) => {
			return {
				name: customParameterDO.name,
				displayName: customParameterDO.displayName,
				description: customParameterDO.description,
				defaultValue: customParameterDO.default,
				regex: customParameterDO.regex,
				regexComment: customParameterDO.regexComment,
				scope: scopeMapping[customParameterDO.scope],
				location: locationMapping[customParameterDO.location],
				type: typeMapping[customParameterDO.type],
				isOptional: customParameterDO.isOptional,
			};
		});
	}
}
