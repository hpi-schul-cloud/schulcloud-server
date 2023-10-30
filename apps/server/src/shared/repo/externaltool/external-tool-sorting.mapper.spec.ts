import { QueryOrderMap } from '@mikro-orm/core';
import { LtiTool } from '@shared/domain/entity/ltitool.entity';
import { SortOrder, SortOrderMap } from '@shared/domain/interface/find-options';
import { ExternalTool } from '@src/modules/tool/external-tool/domain/external-tool.do';
import { ExternalToolEntity } from '@src/modules/tool/external-tool/entity/external-tool.entity';
import { ExternalToolSortingMapper } from './external-tool-sorting.mapper';

describe('ExternalToolSortingMapper', () => {
	describe('mapDOSortOrderToQueryOrder', () => {
		it('should map sortOrderMap of DO to queryOrderMap of entity', () => {
			const doSortOrderMap: SortOrderMap<ExternalTool> = {
				id: SortOrder.asc,
				name: SortOrder.asc,
			};
			const expectedResponse: QueryOrderMap<ExternalToolEntity> = {
				_id: doSortOrderMap.id,
				name: doSortOrderMap.name,
			};

			const entityQueryOrderMap: QueryOrderMap<LtiTool> =
				ExternalToolSortingMapper.mapDOSortOrderToQueryOrder(doSortOrderMap);

			expect(entityQueryOrderMap).toEqual(expectedResponse);
		});

		it('should return queryOrderMap without undefined fields', () => {
			const doSortOrderMap: SortOrderMap<ExternalTool> = {
				id: SortOrder.asc,
				name: undefined,
			};
			const expectedResponse: QueryOrderMap<ExternalToolEntity> = {
				_id: doSortOrderMap.id,
			};

			const entityQueryOrderMap: QueryOrderMap<ExternalToolEntity> =
				ExternalToolSortingMapper.mapDOSortOrderToQueryOrder(doSortOrderMap);

			expect(entityQueryOrderMap).toEqual(expectedResponse);
		});
	});
});
