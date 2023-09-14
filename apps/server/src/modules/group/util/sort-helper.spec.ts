import { SortOrder } from '@shared/domain';
import { SortHelper } from './sort-helper';

describe('SortHelper', () => {
	describe('genericSortFunction', () => {
		describe('when a is defined and b is undefined', () => {
			it('should return more than 0', () => {
				const result: number = SortHelper.genericSortFunction(1, undefined, SortOrder.asc);

				expect(result).toBeGreaterThan(0);
			});
		});

		describe('when a is undefined and b is defined', () => {
			it('should return less than 0', () => {
				const result: number = SortHelper.genericSortFunction(undefined, 1, SortOrder.asc);

				expect(result).toBeLessThan(0);
			});
		});

		describe('when a and b are both undefined', () => {
			it('should return 0', () => {
				const result: number = SortHelper.genericSortFunction(undefined, undefined, SortOrder.asc);

				expect(result).toEqual(0);
			});
		});

		describe('when a is a greater number than b', () => {
			it('should return greater than 0', () => {
				const result: number = SortHelper.genericSortFunction(2, 1, SortOrder.asc);

				expect(result).toBeGreaterThan(0);
			});
		});

		describe('when b is a greater number than a', () => {
			it('should return less than 0', () => {
				const result: number = SortHelper.genericSortFunction(1, 2, SortOrder.asc);

				expect(result).toBeLessThan(0);
			});
		});

		describe('when a is later in the alphabet as b', () => {
			it('should return greater than 0', () => {
				const result: number = SortHelper.genericSortFunction('B', 'A', SortOrder.asc);

				expect(result).toBeGreaterThan(0);
			});
		});

		describe('when b is later in the alphabet as a', () => {
			it('should return less than 0', () => {
				const result: number = SortHelper.genericSortFunction('A', 'B', SortOrder.asc);

				expect(result).toBeLessThan(0);
			});
		});

		describe('when a is greater than b, but the order is reversed', () => {
			it('should return less than 0', () => {
				const result: number = SortHelper.genericSortFunction(2, 1, SortOrder.desc);

				expect(result).toBeLessThan(0);
			});
		});
	});
});
