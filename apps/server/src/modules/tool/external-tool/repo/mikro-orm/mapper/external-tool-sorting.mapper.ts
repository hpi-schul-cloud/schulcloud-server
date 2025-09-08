import { QueryOrderMap } from '@mikro-orm/core';
import { SortOrderMap } from '@shared/domain/interface';
import { type ExternalTool } from '../../../domain';
import { ExternalToolEntity } from '../external-tool.entity';

export class ExternalToolSortingMapper {
	public static mapDOSortOrderToQueryOrder(sort: SortOrderMap<ExternalTool>): QueryOrderMap<ExternalToolEntity> {
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
