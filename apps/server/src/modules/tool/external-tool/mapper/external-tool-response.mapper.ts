import { Injectable } from '@nestjs/common';
import { CustomParameter } from '../../common/domain';
import {
	CustomParameterLocation,
	CustomParameterLocationParams,
	CustomParameterScope,
	CustomParameterScopeTypeParams,
	CustomParameterType,
	CustomParameterTypeParams,
} from '../../common/enum';
import {
	BasicToolConfigResponse,
	CustomParameterResponse,
	ExternalToolImportResultListResponse,
	ExternalToolImportResultResponse,
	ExternalToolMediumResponse,
	ExternalToolResponse,
	Lti11ToolConfigResponse,
	Oauth2ToolConfigResponse,
} from '../controller/dto';
import { BasicToolConfig, ExternalTool, ExternalToolMedium, Lti11ToolConfig, Oauth2ToolConfig } from '../domain';
import { ExternalToolImportResult } from '../uc';

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
	[CustomParameterType.AUTO_MEDIUMID]: CustomParameterTypeParams.AUTO_MEDIUMID,
	[CustomParameterType.AUTO_MOINSCHULE_GROUPUUID]: CustomParameterTypeParams.AUTO_MOINSCHULE_GROUPUUID,
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
			description: externalTool.description,
			url: externalTool.url,
			logoUrl: externalTool.logoUrl,
			thumbnailUrl: externalTool.thumbnail?.uploadUrl,
			config: mappedConfig,
			parameters: mappedCustomParameter,
			isHidden: externalTool.isHidden,
			isDeactivated: externalTool.isDeactivated,
			openNewTab: externalTool.openNewTab,
			restrictToContexts: externalTool.restrictToContexts,
			medium: this.mapMediumToResponse(externalTool.medium),
		});
	}

	private static mapMediumToResponse(medium?: ExternalToolMedium): ExternalToolMediumResponse | undefined {
		if (!medium) {
			return undefined;
		}

		return new ExternalToolMediumResponse({ ...medium });
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
				isProtected: customParameterDO.isProtected,
			};
		});
	}

	public static mapToImportResponse(results: ExternalToolImportResult[]): ExternalToolImportResultListResponse {
		const response: ExternalToolImportResultListResponse = new ExternalToolImportResultListResponse({
			results: results.map(
				(result: ExternalToolImportResult): ExternalToolImportResultResponse =>
					new ExternalToolImportResultResponse(result)
			),
		});

		return response;
	}
}
