export interface IPagination {
	skip?: number;
	limit?: number;
}

export enum SortOrder {
	asc = 'asc',
	desc = 'desc',
}

export type SortOrderMap<T> = Partial<Record<keyof T, SortOrder>>;

export interface IFindOptions<T> {
	pagination?: IPagination;
	order?: SortOrderMap<T>;
}
