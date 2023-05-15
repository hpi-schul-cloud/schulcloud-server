import { Injectable } from '@nestjs/common';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	SortOrderMap,
	ExternalToolDO,
} from '@shared/domain';
import { CustomParameterLocationParams, CustomParameterScopeParams, CustomParameterTypeParams } from '../../interface';
import {
	BasicToolConfig,
	CreateExternalTool,
	CustomParameter,
	ExternalTool,
	Lti11ToolConfig,
	Oauth2ToolConfig,
	UpdateExternalTool,
} from '../../uc/dto';
import {
	BasicToolConfigParams,
	CustomParameterPostParams,
	ExternalToolPostParams,
	ExternalToolSearchParams,
	ExternalToolUpdateParams,
	Lti11ToolConfigParams,
	Oauth2ToolConfigParams,
	SortExternalToolParams,
} from '../dto';

const scopeMapping: Record<CustomParameterScopeParams, CustomParameterScope> = {
	[CustomParameterScopeParams.GLOBAL]: CustomParameterScope.GLOBAL,
	[CustomParameterScopeParams.SCHOOL]: CustomParameterScope.SCHOOL,
	[CustomParameterScopeParams.CONTEXT]: CustomParameterScope.CONTEXT,
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
	[CustomParameterTypeParams.AUTO_COURSEID]: CustomParameterType.AUTO_COURSEID,
	[CustomParameterTypeParams.AUTO_COURSENAME]: CustomParameterType.AUTO_COURSENAME,
	[CustomParameterTypeParams.AUTO_SCHOOLID]: CustomParameterType.AUTO_SCHOOLID,
};

@Injectable()
export class ExternalToolRequestMapper {
	mapExternalToolRequest(
		externalToolPostParams: ExternalToolPostParams | ExternalToolUpdateParams,
		version = 1
	): ExternalTool {
		let mappedConfig: BasicToolConfig | Lti11ToolConfig | Oauth2ToolConfig;
		if (externalToolPostParams.config instanceof BasicToolConfigParams) {
			mappedConfig = this.mapRequestToBasicToolConfigDO(externalToolPostParams.config);
		} else if (externalToolPostParams.config instanceof Lti11ToolConfigParams) {
			mappedConfig = this.mapRequestToLti11ToolConfigDO(externalToolPostParams.config);
		} else {
			mappedConfig = this.mapRequestToOauth2ToolConfigDO(externalToolPostParams.config);
		}

		const mappedCustomParameter: CustomParameter[] = this.mapRequestToCustomParameterDO(
			externalToolPostParams.parameters ?? []
		);

		return {
			id: externalToolPostParams.id,
			name: externalToolPostParams.name || '',
			url: externalToolPostParams.url,
			logoUrl: externalToolPostParams.logoUrl,
			config: mappedConfig,
			parameters: mappedCustomParameter,
			isHidden: externalToolPostParams.isHidden === undefined ? true : externalToolPostParams.isHidden,
			openNewTab: externalToolPostParams.openNewTab === undefined ? true : externalToolPostParams.openNewTab,
			version,
		};
	}

	mapUpdateRequest(externalToolPostParams: ExternalToolUpdateParams, version = 1): UpdateExternalTool {
		return this.mapExternalToolRequest(externalToolPostParams, version);
	}

	mapCreateRequest(externalToolPostParams: ExternalToolPostParams, version = 1): CreateExternalTool {
		return this.mapExternalToolRequest(externalToolPostParams, version);
	}

	private mapRequestToBasicToolConfigDO(externalToolConfigParams: BasicToolConfigParams): BasicToolConfig {
		return { ...externalToolConfigParams };
	}

	private mapRequestToLti11ToolConfigDO(externalToolConfigParams: Lti11ToolConfigParams): Lti11ToolConfig {
		return { ...externalToolConfigParams };
	}

	private mapRequestToOauth2ToolConfigDO(externalToolConfigParams: Oauth2ToolConfigParams): Oauth2ToolConfig {
		return { ...externalToolConfigParams };
	}

	private mapRequestToCustomParameterDO(customParameterParams: CustomParameterPostParams[]): CustomParameter[] {
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

	mapSortingQueryToDomain(sortingQuery: SortExternalToolParams): SortOrderMap<ExternalToolDO> | undefined {
		const { sortBy } = sortingQuery;
		if (sortBy == null) {
			return undefined;
		}

		const result: SortOrderMap<ExternalToolDO> = {
			[sortBy]: sortingQuery.sortOrder,
		};
		return result;
	}

	mapExternalToolFilterQueryToDO(params: ExternalToolSearchParams): Partial<ExternalToolDO> {
		const queryDO: Partial<ExternalToolDO> = { name: params.name };
		return queryDO;
	}
}
