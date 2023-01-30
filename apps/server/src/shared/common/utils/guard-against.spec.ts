import { GuardAgainst } from '@shared/common';

describe('GuardAgainst', () => {
	describe('nullOrUndefined', () => {
		describe('when value is null', () => {
			const error = new Error('value is null');

			it('should throw', () => {
				const value: string | null = null;
				expect(() => GuardAgainst.nullOrUndefined(value, error)).toThrow(error.message);
			});
		});

		describe('when value is undefined', () => {
			const error = new Error('value is undefined');

			it('should throw', () => {
				const value: string | undefined = undefined;
				expect(() => GuardAgainst.nullOrUndefined(value, error)).toThrow(error.message);
			});
		});

		describe('when value is defined', () => {
			const error = new Error('value is null');

			it('should return value', () => {
				const value = '';
				expect(GuardAgainst.nullOrUndefined(value, error)).toBe('');
			});
		});
	});
});
