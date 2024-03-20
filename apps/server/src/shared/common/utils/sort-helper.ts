import { SortOrder } from '../../domain/interface';

export class SortHelper {
	public static genericSortFunction<T>(a: T, b: T, sortOrder: SortOrder = SortOrder.asc): number {
		let order: number;

		if (a != null && b == null) {
			order = 1;
		} else if (a == null && b != null) {
			order = -1;
		} else if (typeof a === 'string' && typeof b === 'string') {
			order = a.localeCompare(b);
		} else if (typeof a === 'number' && typeof b === 'number') {
			order = a - b;
		} else if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
			order = Object.values(a).join().localeCompare(Object.values(b).join());
		} else {
			order = 0;
		}

		return sortOrder === SortOrder.desc ? -order : order;
	}
}
