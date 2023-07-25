import { QueryOrderMap } from '@mikro-orm/core';
import { ExternalTool, ExternalToolDO, SortOrderMap } from '@shared/domain';

export class ExternalToolSortingMapper {
	static mapDOSortOrderToQueryOrder(sort: SortOrderMap<ExternalToolDO>): QueryOrderMap<ExternalTool> {
		const queryOrderMap: QueryOrderMap<ExternalTool> = {
			_id: sort.id,
			name: sort.name,
		};
		Object.keys(queryOrderMap)
			.filter((key) => queryOrderMap[key] === undefined)
			.forEach((key) => delete queryOrderMap[key]);
		return queryOrderMap;
	}
}
