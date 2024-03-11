import { UserSearchQuery } from '../../interfaces';
import { UsersSearchQueryParams } from '../../controller/dto';

export class SearchQueryHelper {
	public static setSearchParametersIfExist(query: UserSearchQuery, params?: UsersSearchQueryParams) {
		if (params?.searchQuery && params.searchQuery.trim().length !== 0) {
			const amountOfSearchWords = params.searchQuery.split(' ').length;
			const searchQueryElements = this.splitForSearchIndexes(params.searchQuery.trim());
			query.searchQuery = `${params.searchQuery} ${searchQueryElements.join(' ')}`;
			// increase gate by searched word, to get better results
			query.searchFilterGate = searchQueryElements.length * 2 + amountOfSearchWords;
			// recreating sort here, to set searchQuery as first (main) parameter of sorting
			query.sort = {
				...query.sort,
				sortBySearchQueryResult: 1,
			};
		}
	}

	public static setDateParametersIfExists(query: UserSearchQuery, params: UsersSearchQueryParams) {
		const dateParameters = ['createdAt', 'outdatedSince', 'lastLoginSystemChange'];
		for (const dateParam of dateParameters) {
			if (params[dateParam]) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				query[dateParam] = params[dateParam];
			}
		}
	}

	private static splitForSearchIndexes(...searchTexts: string[]) {
		const arr: string[] = [];
		searchTexts.forEach((item) => {
			item.split(/[\s-]/g).forEach((it) => {
				if (it.length === 0) return;

				arr.push(it.slice(0, 1));
				if (it.length > 1) arr.push(it.slice(0, 2));
				for (let i = 0; i < it.length - 2; i += 1) arr.push(it.slice(i, i + 3));
			});
		});
		return arr;
	}
}
