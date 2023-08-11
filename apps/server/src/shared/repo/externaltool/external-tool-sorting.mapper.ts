import { QueryOrderMap } from '@mikro-orm/core';
import { SortOrderMap } from '@shared/domain';
import { ExternalTool } from '@src/modules/tool/external-tool/domain';
import { ExternalToolEntity } from '@src/modules/tool/external-tool/entity';

export class ExternalToolSortingMapper {
	static mapDOSortOrderToQueryOrder(sort: SortOrderMap<ExternalTool>): QueryOrderMap<ExternalToolEntity> {
		const queryOrderMap: QueryOrderMap<ExternalToolEntity> = {
			_id: sort.id,
			name: sort.name,
		};
		Object.keys(queryOrderMap)
			.filter((key) => queryOrderMap[key] === undefined)
			.forEach((key) => delete queryOrderMap[key]);
		return queryOrderMap;
	}
}
