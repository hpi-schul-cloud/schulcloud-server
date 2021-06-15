import { ValueOf } from '../types/value-of';

export const SortOrder = {
	asc: 'asc',
	desc: 'desc',
} as const;

export type SortOrderValue = ValueOf<typeof SortOrder>;

export type SortOrderMap<T> = Partial<Record<keyof T, SortOrderValue>>;
