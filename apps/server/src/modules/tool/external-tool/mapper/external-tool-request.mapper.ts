import { Injectable } from '@nestjs/common';
import { SortOrderMap } from '@shared/domain/interface';
import {
	CustomParameterLocation,
	CustomParameterLocationParams,
	CustomParameterScope,
	CustomParameterScopeTypeParams,
	CustomParameterType,
	CustomParameterTypeParams,
} from '../../common/enum';
import { ExternalToolSearchQuery } from '../../common/interface';
import {
	BasicToolConfigParams,
	CustomParameterPostParams,
	ExternalToolBulkCreateParams,
	ExternalToolCreateParams,
	ExternalToolMediumParams,
	ExternalToolSearchParams,
	ExternalToolUpdateParams,
	Lti11ToolConfigCreateParams,
	Lti11ToolConfigUpdateParams,
	Oauth2ToolConfigCreateParams,
	Oauth2ToolConfigUpdateParams,
	SortExternalToolParams,
} from '../controller/dto';
import { ExternalTool } from '../domain';
import {
	BasicToolConfigDto,
	CustomParameterDto,
	ExternalToolCreate,
	ExternalToolMediumDto,
	ExternalToolUpdate,
	Lti11ToolConfigCreate,
	Lti11ToolConfigUpdate,
	Oauth2ToolConfigCreate,
	Oauth2ToolConfigUpdate,
} from '../uc';

const scopeMapping: Record<CustomParameterScopeTypeParams, CustomParameterScope> = {
	[CustomParameterScopeTypeParams.GLOBAL]: CustomParameterScope.GLOBAL,
	[CustomParameterScopeTypeParams.SCHOOL]: CustomParameterScope.SCHOOL,
	[CustomParameterScopeTypeParams.CONTEXT]: CustomParameterScope.CONTEXT,
};

const locationMapping: Record<CustomParameterLocationParams, CustomParameterLocation> = {
	[CustomParameterLocationParams.PATH]: CustomParameterLocation.PATH,
	[CustomParameterLocationParams.QUERY]: CustomParameterLocation.QUERY,
	[CustomParameterLocationParams.BODY]: CustomParameterLocation.BODY,
};

const typeMapping: Record<CustomParameterTypeParams, CustomParameterType> = {
	[CustomParameterTypeParams.STRING]: CustomParameterType.STRING,
	[CustomParameterTypeParams.BOOLEAN]: CustomParameterType.BOOLEAN,
	[CustomParameterTypeParams.NUMBER]: CustomParameterType.NUMBER,
	[CustomParameterTypeParams.AUTO_CONTEXTID]: CustomParameterType.AUTO_CONTEXTID,
	[CustomParameterTypeParams.AUTO_CONTEXTNAME]: CustomParameterType.AUTO_CONTEXTNAME,
	[CustomParameterTypeParams.AUTO_SCHOOLID]: CustomParameterType.AUTO_SCHOOLID,
	[CustomParameterTypeParams.AUTO_SCHOOLNUMBER]: CustomParameterType.AUTO_SCHOOLNUMBER,
	[CustomParameterTypeParams.AUTO_MEDIUMID]: CustomParameterType.AUTO_MEDIUMID,
	[CustomParameterTypeParams.AUTO_GROUPUUID]: CustomParameterType.AUTO_GROUPUUID,
};

@Injectable()
export class ExternalToolRequestMapper {
	public mapUpdateRequest(externalToolUpdateParams: ExternalToolUpdateParams): ExternalToolUpdate {
		let mappedConfig: BasicToolConfigDto | Lti11ToolConfigUpdate | Oauth2ToolConfigUpdate;
		if (externalToolUpdateParams.config instanceof BasicToolConfigParams) {
			mappedConfig = this.mapRequestToBasicToolConfig(externalToolUpdateParams.config);
		} else if (externalToolUpdateParams.config instanceof Lti11ToolConfigUpdateParams) {
			mappedConfig = this.mapRequestToLti11ToolConfigUpdate(externalToolUpdateParams.config);
		} else {
			mappedConfig = this.mapRequestToOauth2ToolConfigUpdate(externalToolUpdateParams.config);
		}

		const mappedCustomParameter: CustomParameterDto[] = this.mapRequestToCustomParameterDO(
			externalToolUpdateParams.parameters ?? []
		);

		return {
			id: externalToolUpdateParams.id,
			name: externalToolUpdateParams.name,
			description: externalToolUpdateParams.description,
			url: externalToolUpdateParams.url,
			logoUrl: externalToolUpdateParams.logoUrl,
			thumbnailUrl: externalToolUpdateParams.thumbnailUrl,
			config: mappedConfig,
			parameters: mappedCustomParameter,
			isHidden: externalToolUpdateParams.isHidden,
			isDeactivated: externalToolUpdateParams.isDeactivated,
			openNewTab: externalToolUpdateParams.openNewTab,
			restrictToContexts: externalToolUpdateParams.restrictToContexts,
			medium: this.mapRequestToExternalToolMedium(externalToolUpdateParams.medium),
		};
	}

	public mapCreateRequest(externalToolCreateParams: ExternalToolCreateParams): ExternalToolCreate {
		let mappedConfig: BasicToolConfigDto | Lti11ToolConfigCreate | Oauth2ToolConfigCreate;
		if (externalToolCreateParams.config instanceof BasicToolConfigParams) {
			mappedConfig = this.mapRequestToBasicToolConfig(externalToolCreateParams.config);
		} else if (externalToolCreateParams.config instanceof Lti11ToolConfigCreateParams) {
			mappedConfig = this.mapRequestToLti11ToolConfigCreate(externalToolCreateParams.config);
		} else {
			mappedConfig = this.mapRequestToOauth2ToolConfigCreate(externalToolCreateParams.config);
		}

		const mappedCustomParameter: CustomParameterDto[] = this.mapRequestToCustomParameterDO(
			externalToolCreateParams.parameters ?? []
		);

		return {
			name: externalToolCreateParams.name,
			url: externalToolCreateParams.url,
			logoUrl: externalToolCreateParams.logoUrl,
			thumbnailUrl: externalToolCreateParams.thumbnailUrl,
			config: mappedConfig,
			parameters: mappedCustomParameter,
			isHidden: externalToolCreateParams.isHidden,
			isDeactivated: externalToolCreateParams.isDeactivated,
			openNewTab: externalToolCreateParams.openNewTab,
			restrictToContexts: externalToolCreateParams.restrictToContexts,
			medium: this.mapRequestToExternalToolMedium(externalToolCreateParams.medium),
			description: externalToolCreateParams.description,
		};
	}

	public mapBulkCreateRequest(externalToolCreateParams: ExternalToolBulkCreateParams): ExternalToolCreate[] {
		const toolList: ExternalToolCreate[] = externalToolCreateParams.data.map(
			(createParams: ExternalToolCreateParams): ExternalToolCreate => this.mapCreateRequest(createParams)
		);

		return toolList;
	}

	private mapRequestToExternalToolMedium(
		externalToolMediumParams: ExternalToolMediumParams | undefined
	): ExternalToolMediumDto | undefined {
		if (!externalToolMediumParams) {
			return undefined;
		}
		return { ...externalToolMediumParams };
	}

	private mapRequestToBasicToolConfig(externalToolConfigParams: BasicToolConfigParams): BasicToolConfigDto {
		return { ...externalToolConfigParams };
	}

	private mapRequestToLti11ToolConfigCreate(
		externalToolConfigParams: Lti11ToolConfigCreateParams
	): Lti11ToolConfigCreate {
		return { ...externalToolConfigParams };
	}

	private mapRequestToLti11ToolConfigUpdate(
		externalToolConfigParams: Lti11ToolConfigUpdateParams
	): Lti11ToolConfigUpdate {
		return { ...externalToolConfigParams };
	}

	private mapRequestToOauth2ToolConfigCreate(
		externalToolConfigParams: Oauth2ToolConfigCreateParams
	): Oauth2ToolConfigCreate {
		return { ...externalToolConfigParams };
	}

	private mapRequestToOauth2ToolConfigUpdate(
		externalToolConfigParams: Oauth2ToolConfigUpdateParams
	): Oauth2ToolConfigUpdate {
		return { ...externalToolConfigParams };
	}

	private mapRequestToCustomParameterDO(customParameterParams: CustomParameterPostParams[]): CustomParameterDto[] {
		return customParameterParams.map((customParameterParam: CustomParameterPostParams) => {
			return {
				name: customParameterParam.name,
				displayName: customParameterParam.displayName,
				description: customParameterParam.description,
				default: customParameterParam.defaultValue,
				regex: customParameterParam.regex,
				regexComment: customParameterParam.regexComment,
				scope: scopeMapping[customParameterParam.scope],
				location: locationMapping[customParameterParam.location],
				type: typeMapping[customParameterParam.type],
				isOptional: customParameterParam.isOptional,
				isProtected: customParameterParam.isProtected,
			};
		});
	}

	mapSortingQueryToDomain(sortingQuery: SortExternalToolParams): SortOrderMap<ExternalTool> | undefined {
		const { sortBy } = sortingQuery;
		if (sortBy == null) {
			return undefined;
		}

		const result: SortOrderMap<ExternalTool> = {
			[sortBy]: sortingQuery.sortOrder,
		};
		return result;
	}

	mapExternalToolFilterQueryToExternalToolSearchQuery(params: ExternalToolSearchParams): ExternalToolSearchQuery {
		const searchQuery: ExternalToolSearchQuery = {
			name: params.name,
			clientId: params.clientId,
		};

		return searchQuery;
	}
}
