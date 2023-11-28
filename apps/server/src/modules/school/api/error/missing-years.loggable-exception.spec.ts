import { MissingYearsLoggableException } from './missing-years.loggable-exception';

describe('MissingYearsLoggableException', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const exception = new MissingYearsLoggableException();

			const result = exception.getLogMessage();

			expect(result).toStrictEqual({
				type: 'INTERNAL_SERVER_ERROR',
				stack: exception.stack,
			});
		});
	});
});
