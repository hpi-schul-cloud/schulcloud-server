import { IdTokenInvalidLoggableException } from './id-token-invalid-loggable-exception';

describe(IdTokenInvalidLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new IdTokenInvalidLoggableException();
			return { exception };
		};

		it('should return a LogMessage', () => {
			const { exception } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				type: 'ID_TOKEN_INVALID',
				message: 'Failed to validate idToken',
				stack: expect.any(String),
			});
		});
	});
});
