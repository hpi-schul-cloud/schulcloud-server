import { TypeGuard } from './type.guard';

describe('TypeGuard', () => {
	describe('isNumber', () => {
		describe('when passing type of value is a number', () => {
			it('should be return true', () => {
				expect(TypeGuard.isNumber(123)).toBe(true);
			});

			it('should be return true', () => {
				expect(TypeGuard.isNumber(-1)).toBe(true);
			});

			it('should be return true', () => {
				expect(TypeGuard.isNumber(NaN)).toBe(true);
			});
		});

		describe('when passing type of value is NOT a number', () => {
			it('should be return false', () => {
				expect(TypeGuard.isNumber(undefined)).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isNumber(null)).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isNumber({})).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isNumber('string')).toBe(false);
			});
		});
	});

	describe('checkNumber', () => {
		describe('when passing type of value is a number', () => {
			it('should be return true', () => {
				expect(TypeGuard.checkNumber(123)).toEqual(undefined);
			});

			it('should be return true', () => {
				expect(TypeGuard.checkNumber(-1)).toEqual(undefined);
			});

			it('should be return true', () => {
				expect(TypeGuard.checkNumber(NaN)).toEqual(undefined);
			});
		});

		describe('when passing type of value is NOT a number', () => {
			it('should be return false', () => {
				expect(() => TypeGuard.checkNumber(undefined)).toThrowError('Type is not a number');
			});

			it('should be return false', () => {
				expect(() => TypeGuard.checkNumber(null)).toThrowError('Type is not a number');
			});

			it('should be return false', () => {
				expect(() => TypeGuard.checkNumber({})).toThrowError('Type is not a number');
			});

			it('should be return false', () => {
				expect(() => TypeGuard.checkNumber('string')).toThrowError('Type is not a number');
			});
		});
	});

	describe('isArrayWithElements', () => {
		describe('when passing type of value is an array with elements', () => {
			it('should be return true', () => {
				expect(TypeGuard.isArrayWithElements([1, 2, 3])).toBe(true);
			});

			it('should be return true', () => {
				expect(TypeGuard.isArrayWithElements(['a', 'b', 'c'])).toBe(true);
			});

			it('should be return true', () => {
				expect(TypeGuard.isArrayWithElements([{ a: 1 }, { b: 2 }])).toBe(true);
			});
		});
	});
});
