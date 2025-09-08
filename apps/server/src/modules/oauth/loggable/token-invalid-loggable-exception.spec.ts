import { TokenInvalidLoggableException } from './token-invalid-loggable-exception';

describe(TokenInvalidLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new TokenInvalidLoggableException();
			return { exception };
		};

		it('should return a LogMessage', () => {
			const { exception } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				type: 'TOKEN_INVALID',
				message: 'Failed to validate token',
				stack: expect.any(String),
			});
		});
	});
});
