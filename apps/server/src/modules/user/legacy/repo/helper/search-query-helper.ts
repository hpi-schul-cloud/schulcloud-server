import { TypeGuard } from '@shared/common/guards';
import { UsersSearchQueryParams } from '../../controller/dto';
import { UserSearchQuery } from '../../interfaces';

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
		const dateFieldNames: (keyof UsersSearchQueryParams)[] = ['createdAt', 'outdatedSince', 'lastLoginSystemChange'];

		dateFieldNames.forEach((fieldName) => {
			const filter = params[fieldName];

			if (filter instanceof Date) {
				query[fieldName] = filter;
				return;
			}

			if (!this.isValidRangeFilter(filter)) return;

			const convertedRangeFilter = this.convertRangeFilterToDateObjects(filter);
			query[fieldName] = convertedRangeFilter;
		});
	}

	private static isValidRangeFilter(rangeFilter: unknown): rangeFilter is Record<string, unknown> {
		return !!rangeFilter && typeof rangeFilter === 'object' && !Array.isArray(rangeFilter);
	}

	private static convertRangeFilterToDateObjects(rangeFilter: Record<string, unknown>): Record<string, Date> {
		const convertedRangeFilter: Record<string, Date> = {};
		const rangeFilterEntries = Object.entries(rangeFilter);

		rangeFilterEntries.forEach(([operator, value]) => {
			const dateValue = this.convertToDateIfValid(value);

			if (dateValue) {
				convertedRangeFilter[operator] = dateValue;
			}
		});

		return convertedRangeFilter;
	}

	private static convertToDateIfValid(value: unknown): Date | undefined {
		const dateString = TypeGuard.checkString(value);
		return dateString ? new Date(dateString) : undefined;
	}
}
