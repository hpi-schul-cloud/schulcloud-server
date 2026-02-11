import { UserSearchQuery } from '../../interfaces';
import { UsersSearchQueryParams } from '../../controller/dto';

export class SearchQueryHelper {
	public static setSearchParametersIfExist(query: UserSearchQuery, params?: UsersSearchQueryParams): void {
		if (params?.searchQuery && params.searchQuery.trim().length !== 0) {
			query.searchQuery = params.searchQuery.trim();
			query.sort = {
				...query.sort,
				sortBySearchQueryResult: 1,
			};
		}
	}

	public static setDateParametersIfExists(query: UserSearchQuery, params: UsersSearchQueryParams): void {
		const dateParameters = ['createdAt', 'outdatedSince', 'lastLoginSystemChange'];
		for (const dateParam of dateParameters) {
			if (params[dateParam]) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				query[dateParam] = params[dateParam];
			}
		}
	}

	public static deletedFilter(query: UserSearchQuery, deletionDate?: Date): void {
		query['$or'] = [{ deletedAt: { $exists: false } }, { deletedAt: null }, { deletedAt: { $gte: deletionDate } }];
	}
}
