import { MissingYearsLoggableException } from './missing-years.loggable-exception';

describe('MissingYearsLoggableException', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const exception = new MissingYearsLoggableException();

			const result = exception.getLogMessage();

			expect(result).toStrictEqual({
				message: 'There must exist at least three school years: last, active and next.',
				type: 'INTERNAL_SERVER_ERROR',
				stack: exception.stack,
			});
		});
	});
});
