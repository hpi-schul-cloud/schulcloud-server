import { LoggingUtils } from './logging.utils';

describe('LoggingUtils', () => {
	describe('isInstanceOfLoggable', () => {
		it('should return false for null', () => {
			expect(LoggingUtils.isInstanceOfLoggable(null)).toBe(false);
		});

		it('should return false for a primitive', () => {
			expect(LoggingUtils.isInstanceOfLoggable('string')).toBe(false);
		});

		it('should return false for an object without getLogMessage', () => {
			expect(LoggingUtils.isInstanceOfLoggable({ foo: 'bar' })).toBe(false);
		});

		it('should return true for an object with getLogMessage', () => {
			const loggable = {
				getLogMessage: () => {
					return { message: 'test' };
				},
			};

			expect(LoggingUtils.isInstanceOfLoggable(loggable)).toBe(true);
		});
	});
});
