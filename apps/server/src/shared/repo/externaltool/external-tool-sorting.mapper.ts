import { QueryOrderMap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { ExternalTool, SortOrderMap, ExternalToolDO } from '@shared/domain';

@Injectable()
export class ExternalToolSortingMapper {
	mapDOSortOrderToQueryOrder(sort: SortOrderMap<ExternalToolDO>): QueryOrderMap<ExternalTool> {
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
