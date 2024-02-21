import { User } from '@shared/domain/entity';
import { SortOrderNumberType } from '@shared/domain/interface';

export interface UserSortQuery extends SortOrderNumberType<User> {
	searchQuery?: number;
}
