import { QueryOrderMap } from '@mikro-orm/core';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolEntity } from '@modules/tool/external-tool/entity';
import { SortOrderMap } from '@shared/domain/interface';

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
