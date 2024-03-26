import { IdmCallbackLoggableException } from './idm-callback-loggable-exception';

describe('IdmCallbackLoggableException', () => {
	describe('getLogMessage', () => {
		describe('when error ist of type Error', () => {
			it('should return log message', () => {
				const error = new Error('error');
				const exception = new IdmCallbackLoggableException(error);

				const result = exception.getLogMessage();

				expect(result).toEqual(expect.objectContaining({ message: 'error', stack: error.stack }));
			});
		});
		describe('when error is not of type Error', () => {
			it('should return log message', () => {
				const error = 'error';
				const exception = new IdmCallbackLoggableException(error);

				const result = exception.getLogMessage();

				expect(result).toEqual(
					expect.objectContaining({
						message: 'error accessing IDM callback',
						data: { callbackError: JSON.stringify(error) },
					})
				);
			});
		});
	});
});
