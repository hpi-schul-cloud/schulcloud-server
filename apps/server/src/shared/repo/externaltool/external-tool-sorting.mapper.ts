import { QueryOrderMap } from '@mikro-orm/core';
import { SortOrderMap } from '@shared/domain';
import { ExternalToolDO } from '@src/modules/tool/external-tool/domain';
import { ExternalToolEntity } from '@src/modules/tool/external-tool/entity';

export class ExternalToolSortingMapper {
	static mapDOSortOrderToQueryOrder(sort: SortOrderMap<ExternalToolDO>): QueryOrderMap<ExternalToolEntity> {
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
