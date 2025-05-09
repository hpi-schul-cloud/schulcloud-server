import { ErrorLogMessage } from '@core/logger';
import { BiloNotFoundResponseLoggableException } from './bilo-not-found-response.loggable-exception';

describe(BiloNotFoundResponseLoggableException.name, () => {
	describe('getLogMessage', () => {
		it('should return the correct log message', () => {
			const exception = new BiloNotFoundResponseLoggableException();

			const result = exception.getLogMessage();

			expect(result).toEqual<ErrorLogMessage>({
				type: 'BILDUNGSLOGIN_NOT_FOUND_RESPONSE',
				stack: exception.stack,
				data: {
					message: 'BILDUNGSLOGIN not found response.',
				},
			});
		});
	});
});
