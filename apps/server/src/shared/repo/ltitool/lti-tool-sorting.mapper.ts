import { Injectable } from '@nestjs/common';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiTool, SortOrderMap } from '@shared/domain';
import { QueryOrderMap } from '@mikro-orm/core/enums';

@Injectable()
export class LtiToolSortingMapper {
	mapDOSortOrderToQueryOrder(sort: SortOrderMap<LtiToolDO>): QueryOrderMap<LtiTool> {
		const queryOrderMap: QueryOrderMap<LtiTool> = {
			_id: sort.id,
			name: sort.name,
			url: sort.url,
			key: sort.key,
			secret: sort.secret,
			logo_url: sort.logo_url,
			lti_message_type: sort.lti_message_type,
			lti_version: sort.lti_version,
			resource_link_id: sort.resource_link_id,
			roles: sort.roles,
			privacy_permission: sort.privacy_permission,
			customs: sort.customs,
			isTemplate: sort.isTemplate,
			isLocal: sort.isLocal,
			originToolId: sort.originToolId,
			oAuthClientId: sort.oAuthClientId,
			friendlyUrl: sort.friendlyUrl,
			skipConsent: sort.skipConsent,
			openNewTab: sort.openNewTab,
			frontchannel_logout_uri: sort.frontchannel_logout_uri,
			isHidden: sort.isHidden,
		};
		Object.keys(queryOrderMap)
			.filter((key) => queryOrderMap[key] === undefined)
			.forEach((key) => delete queryOrderMap[key]);
		return queryOrderMap;
	}
}
