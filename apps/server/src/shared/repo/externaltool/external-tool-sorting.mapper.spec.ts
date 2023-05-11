import { QueryOrderMap } from '@mikro-orm/core';
import { ExternalTool, LtiTool, SortOrder, SortOrderMap, ExternalToolDO } from '@shared/domain';
import { ExternalToolSortingMapper } from '@shared/repo';

describe('ExternalToolSortingMapper', () => {
	let mapper: ExternalToolSortingMapper;

	beforeAll(() => {
		mapper = new ExternalToolSortingMapper();
	});

	describe('mapDOSortOrderToQueryOrder', () => {
		it('should map sortOrderMap of DO to queryOrderMap of entity', () => {
			const doSortOrderMap: SortOrderMap<ExternalToolDO> = {
				id: SortOrder.asc,
				name: SortOrder.asc,
			};
			const expectedResponse: QueryOrderMap<ExternalTool> = {
				_id: doSortOrderMap.id,
				name: doSortOrderMap.name,
			};

			const entityQueryOrderMap: QueryOrderMap<LtiTool> = mapper.mapDOSortOrderToQueryOrder(doSortOrderMap);

			expect(entityQueryOrderMap).toEqual(expectedResponse);
		});

		it('should return queryOrderMap without undefined fields', () => {
			const doSortOrderMap: SortOrderMap<ExternalToolDO> = {
				id: SortOrder.asc,
				name: undefined,
			};
			const expectedResponse: QueryOrderMap<ExternalTool> = {
				_id: doSortOrderMap.id,
			};

			const entityQueryOrderMap: QueryOrderMap<ExternalTool> = mapper.mapDOSortOrderToQueryOrder(doSortOrderMap);

			expect(entityQueryOrderMap).toEqual(expectedResponse);
		});
	});
});
