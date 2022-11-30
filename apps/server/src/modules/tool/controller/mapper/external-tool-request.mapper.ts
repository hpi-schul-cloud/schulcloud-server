import { Injectable } from '@nestjs/common';
import {
	BasicToolConfigDO,
	CustomParameterDO,
	ExternalToolDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/external-tool';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType, SortOrderMap } from '@shared/domain';
import { CustomParameterLocationParams, CustomParameterScopeParams, CustomParameterTypeParams } from '../../interface';
import {
	BasicToolConfigParams,
	CustomParameterCreateParams,
	ExternalToolParams,
	ExternalToolSearchParams,
	Lti11ToolConfigParams,
	Oauth2ToolConfigParams,
	SortExternalToolParams,
} from '../dto';

const scopeMapping: Record<CustomParameterScopeParams, CustomParameterScope> = {
	[CustomParameterScopeParams.COURSE]: CustomParameterScope.COURSE,
	[CustomParameterScopeParams.SCHOOL]: CustomParameterScope.SCHOOL,
};

const locationMapping: Record<CustomParameterLocationParams, CustomParameterLocation> = {
	[CustomParameterLocationParams.PATH]: CustomParameterLocation.PATH,
	[CustomParameterLocationParams.QUERY]: CustomParameterLocation.QUERY,
	[CustomParameterLocationParams.TOKEN]: CustomParameterLocation.TOKEN,
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
	mapRequestToExternalToolDO(externalToolParams: ExternalToolParams, version = 1): ExternalToolDO {
		let mappedConfig: BasicToolConfigDO | Lti11ToolConfigDO | Oauth2ToolConfigDO;
		if (externalToolParams.config instanceof BasicToolConfigParams) {
			mappedConfig = this.mapRequestToBasicToolConfigDO(externalToolParams.config);
		} else if (externalToolParams.config instanceof Lti11ToolConfigParams) {
			mappedConfig = this.mapRequestToLti11ToolConfigDO(externalToolParams.config);
		} else {
			mappedConfig = this.mapRequestToOauth2ToolConfigDO(externalToolParams.config);
		}

		const mappedCustomParameter: CustomParameterDO[] = this.mapRequestToCustomParameterDO(
			externalToolParams.parameters ?? []
		);

		return new ExternalToolDO({
			name: externalToolParams.name,
			url: externalToolParams.url,
			logoUrl: externalToolParams.logoUrl,
			config: mappedConfig,
			parameters: mappedCustomParameter,
			isHidden: externalToolParams.isHidden,
			openNewTab: externalToolParams.openNewTab,
			version,
		});
	}

	private mapRequestToBasicToolConfigDO(externalToolConfigParams: BasicToolConfigParams): BasicToolConfigDO {
		return new BasicToolConfigDO({ ...externalToolConfigParams });
	}

	private mapRequestToLti11ToolConfigDO(externalToolConfigParams: Lti11ToolConfigParams): Lti11ToolConfigDO {
		return new Lti11ToolConfigDO({ ...externalToolConfigParams });
	}

	private mapRequestToOauth2ToolConfigDO(externalToolConfigParams: Oauth2ToolConfigParams): Oauth2ToolConfigDO {
		return new Oauth2ToolConfigDO({ ...externalToolConfigParams });
	}

	private mapRequestToCustomParameterDO(customParameterParams: CustomParameterCreateParams[]): CustomParameterDO[] {
		return customParameterParams.map((customParameterParam: CustomParameterCreateParams) => {
			return new CustomParameterDO({
				name: customParameterParam.name,
				default: customParameterParam.default,
				regex: customParameterParam.regex,
				scope: scopeMapping[customParameterParam.scope],
				location: locationMapping[customParameterParam.location],
				type: typeMapping[customParameterParam.type],
			});
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
