import { SortOrderNumberType } from '@shared/domain/interface';

export interface UserSortQuery extends SortOrderNumberType {
	sortBySearchQueryResult?: number;
}
