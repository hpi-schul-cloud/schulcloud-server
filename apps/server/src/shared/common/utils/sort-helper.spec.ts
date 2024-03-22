import { SortOrder } from '../../domain/interface';
import { SortHelper } from './sort-helper';

describe('SortHelper', () => {
	describe('genericSortFunction', () => {
		describe('when a is defined and b is undefined', () => {
			it('should return more than 0', () => {
				const result: number = SortHelper.genericSortFunction(1, undefined, SortOrder.asc);

				expect(result).toBeGreaterThan(0);
			});
		});

		describe('when a is defined and b is null', () => {
			it('should return more than 0', () => {
				const result: number = SortHelper.genericSortFunction(1, null, SortOrder.asc);

				expect(result).toBeGreaterThan(0);
			});
		});

		describe('when a is undefined and b is defined', () => {
			it('should return less than 0', () => {
				const result: number = SortHelper.genericSortFunction(undefined, 1, SortOrder.asc);

				expect(result).toBeLessThan(0);
			});
		});

		describe('when a is null and b is defined', () => {
			it('should return less than 0', () => {
				const result: number = SortHelper.genericSortFunction(null, 1, SortOrder.asc);

				expect(result).toBeLessThan(0);
			});
		});

		describe('when a and b are both undefined', () => {
			it('should return 0', () => {
				const result: number = SortHelper.genericSortFunction(undefined, undefined, SortOrder.asc);

				expect(result).toEqual(0);
			});
		});

		describe('when a and b are both null', () => {
			it('should return 0', () => {
				const result: number = SortHelper.genericSortFunction(null, null, SortOrder.asc);

				expect(result).toEqual(0);
			});
		});

		describe('when number a is a greater number than number b', () => {
			it('should return greater than 0', () => {
				const result: number = SortHelper.genericSortFunction(1, 0, SortOrder.asc);

				expect(result).toBeGreaterThan(0);
			});
		});

		describe('when number b is a greater number than number a', () => {
			it('should return less than 0', () => {
				const result: number = SortHelper.genericSortFunction(0, 1, SortOrder.asc);

				expect(result).toBeLessThan(0);
			});
		});

		describe('when string a is later in the alphabet as string b', () => {
			it('should return greater than 0', () => {
				const result: number = SortHelper.genericSortFunction('B', 'A', SortOrder.asc);

				expect(result).toBeGreaterThan(0);
			});
		});

		describe('when string b is later in the alphabet as string a', () => {
			it('should return less than 0', () => {
				const result: number = SortHelper.genericSortFunction('A', 'B', SortOrder.asc);

				expect(result).toBeLessThan(0);
			});
		});

		describe('when object a as value string is later in the alphabet as object b as value string', () => {
			it('should return greater than 0', () => {
				const result: number = SortHelper.genericSortFunction({ test: 'B' }, { test: 'A' }, SortOrder.asc);

				expect(result).toBeGreaterThan(0);
			});
		});

		describe('when object b as value string is later in the alphabet as object a as value string', () => {
			it('should return less than 0', () => {
				const result: number = SortHelper.genericSortFunction({ test: 'A' }, { test: 'B' }, SortOrder.asc);

				expect(result).toBeLessThan(0);
			});
		});

		describe('when array a as value string is later in the alphabet as array b as value string', () => {
			it('should return greater than 0', () => {
				const result: number = SortHelper.genericSortFunction(['B'], ['A'], SortOrder.asc);

				expect(result).toBeGreaterThan(0);
			});
		});

		describe('when array b as value string is later in the alphabet as array a as value string', () => {
			it('should return less than 0', () => {
				const result: number = SortHelper.genericSortFunction(['A'], ['B'], SortOrder.asc);

				expect(result).toBeLessThan(0);
			});
		});

		describe('when array b as value string is later in the alphabet as array a as value string', () => {
			it('should return less than 0', () => {
				const result: number = SortHelper.genericSortFunction([], ['A'], SortOrder.asc);

				expect(result).toBeLessThan(0);
			});
		});

		describe('when array b as value string is later in the alphabet as array a as value string', () => {
			it('should return greater than 0', () => {
				const result: number = SortHelper.genericSortFunction(['A'], [], SortOrder.asc);

				expect(result).toBeGreaterThan(0);
			});
		});

		describe('when number a is greater than number b, but the order is reversed', () => {
			it('should return less than 0', () => {
				const result: number = SortHelper.genericSortFunction(2, 1, SortOrder.desc);

				expect(result).toBeLessThan(0);
			});
		});
	});
});
