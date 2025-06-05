import { StringValidator } from '.';

// TODO: Rewrite me
describe('StringValidator', () => {
	describe('isString', () => {
		it('should resolve true for string values', () => {
			expect(StringValidator.isString('sample string value')).toEqual(true);
		});

		it('should resolve false for other types', () => {
			expect(StringValidator.isString(0 as unknown as string)).toEqual(false);
			expect(StringValidator.isString(1 as unknown as string)).toEqual(false);
			expect(StringValidator.isString(false as unknown as string)).toEqual(false);
			expect(StringValidator.isString(true as unknown as string)).toEqual(false);
			expect(StringValidator.isString({} as unknown as string)).toEqual(false);
			expect(StringValidator.isString(null as unknown as string)).toEqual(false);
			expect(StringValidator.isString(undefined)).toEqual(false);
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
