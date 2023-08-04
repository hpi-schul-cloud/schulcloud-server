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
import { statusMapping } from '../../school-external-tool/mapper';
import {
	BasicToolConfigResponse,
	CustomParameterResponse,
	ExternalToolLogoResponse,
	ExternalToolResponse,
	Lti11ToolConfigResponse,
	Oauth2ToolConfigResponse,
	ToolReferenceResponse,
} from '../controller/dto';
import { BasicToolConfig, ExternalTool, Lti11ToolConfig, Oauth2ToolConfig, ToolReference } from '../domain';

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

	static mapToToolReferenceResponses(toolReferences: ToolReference[]): ToolReferenceResponse[] {
		const toolReferenceResponses: ToolReferenceResponse[] = toolReferences.map((toolReference: ToolReference) =>
			this.mapToToolReferenceResponse(toolReference)
		);

		return toolReferenceResponses;
	}

	private static mapToToolReferenceResponse(toolReference: ToolReference): ToolReferenceResponse {
		const response = new ToolReferenceResponse({
			contextToolId: toolReference.contextToolId,
			displayName: toolReference.displayName,
			logoUrl: toolReference.logoUrl,
			openInNewTab: toolReference.openInNewTab,
			status: statusMapping[toolReference.status],
		});

		return response;
	}
}
