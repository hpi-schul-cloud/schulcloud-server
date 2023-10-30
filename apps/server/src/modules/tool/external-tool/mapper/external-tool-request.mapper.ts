import { Injectable } from '@nestjs/common';
import { SortOrderMap } from '@shared/domain/interface/find-options';
import { CustomParameterLocation } from '../../common/enum/custom-parameter-location.enum';
import { CustomParameterScope } from '../../common/enum/custom-parameter-scope.enum';
import { CustomParameterType } from '../../common/enum/custom-parameter-type.enum';
import { CustomParameterLocationParams } from '../../common/enum/request-response/custom-parameter-location.enum';
import { CustomParameterScopeTypeParams } from '../../common/enum/request-response/custom-parameter-scope-type.enum';
import { CustomParameterTypeParams } from '../../common/enum/request-response/custom-parameter-type.enum';
import { ExternalToolSearchQuery } from '../../common/interface/external-tool-search-query';
import { BasicToolConfigParams } from '../controller/dto/request/config/basic-tool-config.params';
import { Lti11ToolConfigCreateParams } from '../controller/dto/request/config/lti11-tool-config-create.params';
import { Lti11ToolConfigUpdateParams } from '../controller/dto/request/config/lti11-tool-config-update.params';
import { Oauth2ToolConfigCreateParams } from '../controller/dto/request/config/oauth2-tool-config-create.params';
import { Oauth2ToolConfigUpdateParams } from '../controller/dto/request/config/oauth2-tool-config-update.params';
import { CustomParameterPostParams } from '../controller/dto/request/custom-parameter.params';
import { ExternalToolCreateParams } from '../controller/dto/request/external-tool-create.params';
import { ExternalToolSearchParams } from '../controller/dto/request/external-tool-search.params';
import { SortExternalToolParams } from '../controller/dto/request/external-tool-sort.params';
import { ExternalToolUpdateParams } from '../controller/dto/request/external-tool-update.params';
import { ExternalTool } from '../domain/external-tool.do';
import {
	BasicToolConfigDto,
	CustomParameterDto,
	ExternalToolCreate,
	ExternalToolUpdate,
	Lti11ToolConfigCreate,
	Lti11ToolConfigUpdate,
	Oauth2ToolConfigCreate,
	Oauth2ToolConfigUpdate,
} from '../uc/dto/external-tool.types';

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
};

@Injectable()
export class ExternalToolRequestMapper {
	public mapUpdateRequest(externalToolUpdateParams: ExternalToolUpdateParams, version = 1): ExternalToolUpdate {
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
			url: externalToolUpdateParams.url,
			logoUrl: externalToolUpdateParams.logoUrl,
			config: mappedConfig,
			parameters: mappedCustomParameter,
			isHidden: externalToolUpdateParams.isHidden,
			openNewTab: externalToolUpdateParams.openNewTab,
			version,
		};
	}

	public mapCreateRequest(externalToolCreateParams: ExternalToolCreateParams, version = 1): ExternalToolCreate {
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
			config: mappedConfig,
			parameters: mappedCustomParameter,
			isHidden: externalToolCreateParams.isHidden,
			openNewTab: externalToolCreateParams.openNewTab,
			version,
		};
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
