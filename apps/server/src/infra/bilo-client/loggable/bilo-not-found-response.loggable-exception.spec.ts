import { ErrorLogMessage } from '@core/logger';
import { BiloBadRequestResponseLoggableException } from './bilo-bad-request-response.loggable-exception';

describe(BiloBadRequestResponseLoggableException.name, () => {
	describe('getLogMessage', () => {
		it('should return the correct log message', () => {
			const exception = new BiloBadRequestResponseLoggableException();

			const result = exception.getLogMessage();

			expect(result).toEqual<ErrorLogMessage>({
				type: 'BILDUNGSLOGIN_BAD_REQUEST_RESPONSE',
				stack: exception.stack,
				data: {
					message: 'BILDUNGSLOGIN bad request response.',
				},
			});
		});
	});
});
