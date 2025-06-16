import { StringValidator } from '.';

describe('StringValidator', () => {
	describe('isString', () => {
		it('should return false for null', () => {
			expect(StringValidator.isString(null as unknown as string)).toEqual(false);
		});

		it('should return false for undefined', () => {
			expect(StringValidator.isString(undefined)).toEqual(false);
		});

		it('should return true for a valid string', () => {
			expect(StringValidator.isString('hello')).toEqual(true);
		});

		it('should return false for a number', () => {
			expect(StringValidator.isString(123 as unknown as string)).toEqual(false);
		});

		it('should return false for an object', () => {
			expect(StringValidator.isString({} as unknown as string)).toEqual(false);
		});

		it('should return false for an array', () => {
			expect(StringValidator.isString([] as unknown as string)).toEqual(false);
		});
	});

	describe('isNotEmptyString', () => {
		it('should return true for a non-empty string', () => {
			expect(StringValidator.isNotEmptyString('hello')).toBe(true);
		});

		it('should return false for an empty string', () => {
			expect(StringValidator.isNotEmptyString('')).toBe(false);
		});

		it('should return false for undefined', () => {
			expect(StringValidator.isNotEmptyString(undefined)).toBe(false);
		});

		it('should return false for null', () => {
			expect(StringValidator.isNotEmptyString(null as unknown as string)).toBe(false);
		});
	});

	describe('isNotEmptyStringWhenTrimed', () => {
		it('should return true for a non-empty string with no leading or trailing spaces', () => {
			expect(StringValidator.isNotEmptyStringWhenTrimed('hello')).toBe(true);
		});

		it('should return true for a string with leading or trailing spaces that is non-empty after trimming', () => {
			expect(StringValidator.isNotEmptyStringWhenTrimed('   hello   ')).toBe(true);
		});

		it('should return false for a string that is empty after trimming', () => {
			expect(StringValidator.isNotEmptyStringWhenTrimed('   ')).toBe(false);
		});

		it('should return false for an empty string', () => {
			expect(StringValidator.isNotEmptyStringWhenTrimed('')).toBe(false);
		});

		it('should return false for undefined', () => {
			expect(StringValidator.isNotEmptyStringWhenTrimed(undefined)).toBe(false);
		});

		it('should return false for null', () => {
			expect(StringValidator.isNotEmptyStringWhenTrimed(null as unknown as string)).toBe(false);
		});
	});
});
