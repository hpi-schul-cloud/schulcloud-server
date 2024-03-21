export interface Pagination {
	skip?: number;
	limit?: number;
}

export enum SortOrder {
	asc = 'asc',
	desc = 'desc',
}

export type SortOrderMap<T> = Partial<Record<keyof T, SortOrder>>;

export interface IFindOptions<T> {
	pagination?: Pagination;
	order?: SortOrderMap<T>;
}

export type SortOrderNumberType = Partial<Record<string, number>>;
