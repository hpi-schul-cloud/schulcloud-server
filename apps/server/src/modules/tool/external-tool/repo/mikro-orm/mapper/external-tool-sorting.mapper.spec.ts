import { QueryOrderMap } from '@mikro-orm/core';
import { SortOrder, SortOrderMap } from '@shared/domain/interface';
import { ExternalTool } from '../../../domain';
import { ExternalToolEntity } from '../external-tool.entity';
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

			const entityQueryOrderMap: QueryOrderMap<ExternalToolEntity> =
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
