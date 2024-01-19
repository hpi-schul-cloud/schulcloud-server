import { AuthCodeFailureLoggableException } from './auth-code-failure-loggable-exception';

describe(AuthCodeFailureLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const errorCode = 'error_code';
			const exception = new AuthCodeFailureLoggableException(errorCode);
			return { errorCode, exception };
		};

		it('should return a LogMessage', () => {
			const { errorCode, exception } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				type: 'SSO_AUTH_CODE_STEP',
				message: 'Authorization Query Object has no authorization code or error',
				stack: exception.stack,
				data: {
					errorCode,
				},
			});
		});
	});
});
