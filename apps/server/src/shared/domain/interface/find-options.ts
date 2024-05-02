import { GroupTypes } from '@modules/group';
import { EntityId } from '@shared/domain/types';

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

// TODO N21-1860 delete
export interface IFindQuery {
	pagination?: Pagination;
	nameQuery?: string;
}

export interface IGroupFilter {
	userId?: EntityId;
	schoolId?: EntityId;
	groupTypes?: GroupTypes[];
	nameQuery?: string;
	availableGroupsForCourseSync?: boolean;
	systemId?: EntityId;
}

export type SortOrderNumberType = Partial<Record<string, number>>;
