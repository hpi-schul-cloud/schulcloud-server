import { StringValidator } from '.';

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
		describe('when trim is disabled', () => {
			it('should resolve true for given string with', () => {
				expect(StringValidator.isNotEmptyString('hello world')).toEqual(true);
			});
			it('should resolve false for empty string', () => {
				expect(StringValidator.isNotEmptyString('')).toEqual(false);
			});
			it('should resolve true for whitespace string', () => {
				expect(StringValidator.isNotEmptyString(' ')).toEqual(true);
				expect(StringValidator.isNotEmptyString('\n', false)).toEqual(true);
				expect(StringValidator.isNotEmptyString('\n')).toEqual(true);
			});
			it('should resolve false for undefined string', () => {
				expect(StringValidator.isNotEmptyString(undefined, false)).toEqual(false);
			});
		});
		describe('when trim is enabled', () => {
			it('should resolve true for given string with', () => {
				expect(StringValidator.isNotEmptyString('hello world', true)).toEqual(true);
			});
			it('should resolve false for empty string', () => {
				expect(StringValidator.isNotEmptyString('', true)).toEqual(false);
			});
			it('should resolve false for whitespace string', () => {
				expect(StringValidator.isNotEmptyString(' ', true)).toEqual(false);
				expect(StringValidator.isNotEmptyString('\n', true)).toEqual(false);
				expect(StringValidator.isNotEmptyString('\t', true)).toEqual(false);
			});
			it('should resolve false for undefined string', () => {
				expect(StringValidator.isNotEmptyString(undefined, true)).toEqual(false);
			});
		});
	});
});
