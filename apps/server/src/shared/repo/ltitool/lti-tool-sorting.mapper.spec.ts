import { LtiTool, SortOrder, SortOrderMap } from '@shared/domain';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolSortingMapper } from '@shared/repo/ltitool/lti-tool-sorting.mapper';
import { QueryOrderMap } from '@mikro-orm/core/enums';

describe('LtiToolSortingMapper', () => {
	let mapper: LtiToolSortingMapper;

	beforeAll(() => {
		mapper = new LtiToolSortingMapper();
	});

	describe('mapDOSortOrderToQueryOrder', () => {
		it('should map sortOrderMap of DO to queryOrderMap of entity', () => {
			const doSortOrderMap: SortOrderMap<LtiToolDO> = {
				id: SortOrder.asc,
				name: SortOrder.asc,
				url: SortOrder.asc,
				key: SortOrder.asc,
				secret: SortOrder.asc,
				logo_url: SortOrder.asc,
				lti_message_type: SortOrder.asc,
				lti_version: SortOrder.asc,
				resource_link_id: SortOrder.asc,
				roles: SortOrder.asc,
				privacy_permission: SortOrder.asc,
				isTemplate: SortOrder.asc,
				isLocal: SortOrder.asc,
				originToolId: SortOrder.asc,
				oAuthClientId: SortOrder.asc,
				friendlyUrl: SortOrder.asc,
				skipConsent: SortOrder.asc,
				openNewTab: SortOrder.asc,
				frontchannel_logout_uri: SortOrder.asc,
				isHidden: SortOrder.asc,
			};
			const expectedResponse: QueryOrderMap<LtiTool> = {
				_id: doSortOrderMap.id,
				name: doSortOrderMap.name,
				url: doSortOrderMap.url,
				key: doSortOrderMap.key,
				secret: doSortOrderMap.secret,
				logo_url: doSortOrderMap.logo_url,
				lti_message_type: doSortOrderMap.lti_message_type,
				lti_version: doSortOrderMap.lti_version,
				resource_link_id: doSortOrderMap.resource_link_id,
				roles: doSortOrderMap.roles,
				privacy_permission: doSortOrderMap.privacy_permission,
				isTemplate: doSortOrderMap.isTemplate,
				isLocal: doSortOrderMap.isLocal,
				originToolId: doSortOrderMap.originToolId,
				oAuthClientId: doSortOrderMap.oAuthClientId,
				friendlyUrl: doSortOrderMap.friendlyUrl,
				skipConsent: doSortOrderMap.skipConsent,
				openNewTab: doSortOrderMap.openNewTab,
				frontchannel_logout_uri: doSortOrderMap.frontchannel_logout_uri,
				isHidden: doSortOrderMap.isHidden,
			};

			const entityQueryOrderMap: QueryOrderMap<LtiTool> = mapper.mapDOSortOrderToQueryOrder(doSortOrderMap);

			expect(entityQueryOrderMap).toEqual(expectedResponse);
		});

		it('should return queryOrderMap without undefined fields', () => {
			const doSortOrderMap: SortOrderMap<LtiToolDO> = {
				id: SortOrder.asc,
				name: undefined,
			};
			const expectedResponse: QueryOrderMap<LtiTool> = {
				_id: doSortOrderMap.id,
			};

			const entityQueryOrderMap: QueryOrderMap<LtiTool> = mapper.mapDOSortOrderToQueryOrder(doSortOrderMap);

			expect(entityQueryOrderMap).toEqual(expectedResponse);
		});
	});
});
