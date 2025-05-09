import { ErrorLogMessage } from '@core/logger';
import { BiloMediaQueryUnprocessableResponseLoggableException } from './bilo-media-query-unprocessable-response.loggable-exception';

describe(BiloMediaQueryUnprocessableResponseLoggableException.name, () => {
	describe('getLogMessage', () => {
		it('should return the correct log message', () => {
			const exception = new BiloMediaQueryUnprocessableResponseLoggableException();

			const result = exception.getLogMessage();

			expect(result).toEqual<ErrorLogMessage>({
				type: 'BILO_MEDIA_QUERY_UNPROCESSABLE_RESPONSE',
				stack: exception.stack,
				data: {
					message: 'The response body from bilo media query could not be processed',
				},
			});
		});
	});
});
