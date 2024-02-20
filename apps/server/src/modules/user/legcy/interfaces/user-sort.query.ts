import { User } from '@shared/domain/entity';
import { SortOrderMap } from '@shared/domain/interface';

export interface UserSortQuery extends SortOrderMap<User> {
	searchQuery?: number;
}
