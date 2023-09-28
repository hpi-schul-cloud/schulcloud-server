import { SortOrder } from '@shared/domain';

export class SortHelper {
	public static genericSortFunction<T>(a: T, b: T, sortOrder: SortOrder): number {
		let order: number;

		if (typeof a !== 'undefined' && typeof b === 'undefined') {
			order = 1;
		} else if (typeof a === 'undefined' && typeof b !== 'undefined') {
			order = -1;
		} else if (typeof a === 'string' && typeof b === 'string') {
			order = a.localeCompare(b);
		} else if (typeof a === 'number' && typeof b === 'number') {
			order = a - b;
		} else {
			order = 0;
		}

		return sortOrder === SortOrder.desc ? -order : order;
	}
}
