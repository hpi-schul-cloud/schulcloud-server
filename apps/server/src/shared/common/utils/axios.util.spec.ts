import { isAxiosError } from './axios.util';

describe('axios.util', () => {
	describe('isAxiosError', () => {
		it('should return true when error is an axios error', () => {
			const axiosError = {
				isAxiosError: true,
			};
			expect(isAxiosError(axiosError)).toBe(true);
		});

		it('should return false when error is not an axios error', () => {
			const error = new Error('some error');
			expect(isAxiosError(error)).toBe(false);
		});

		it('should return false when error is undefined', () => {
			expect(isAxiosError(undefined)).toBe(false);
		});
	});
});
