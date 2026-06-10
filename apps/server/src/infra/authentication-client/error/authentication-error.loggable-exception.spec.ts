import { AuthenticationErrorLoggableException } from './authentication-error.loggable-exception';

describe('AuthenticationErrorLoggableException', () => {
	describe('when error is instance of Error', () => {
		describe('getLogMessage', () => {
			const setup = () => {
				const email = 'test@example.com';

				const error = new Error('testError');
				const exception = new AuthenticationErrorLoggableException(error, email);

				return {
					error,
					exception,
				};
			};

			it('should log the correct message', () => {
				const { error, exception } = setup();

				const result = exception.getLogMessage();

				expect(result).toEqual({
					type: AuthenticationErrorLoggableException.name,
					error,
					stack: expect.any(String),
					data: {
						email: 'tes*@example.com',
						message: 'Authentication failed for the provided credentials',
					},
				});
			});
		});
	});

	describe('when error is NOT instance of Error', () => {
		describe('getLogMessage', () => {
			const setup = () => {
				const email = 'test@example.com';

				const error = { code: '123', message: 'testError' };
				const exception = new AuthenticationErrorLoggableException(error, email);

				return {
					error,
					exception,
				};
			};

			it('should log the correct message', () => {
				const { error, exception } = setup();

				const result = exception.getLogMessage();

				expect(result).toEqual({
					type: AuthenticationErrorLoggableException.name,
					error: new Error(JSON.stringify(error)),
					stack: expect.any(String),
					data: {
						email: 'tes*@example.com',
						message: 'Authentication failed for the provided credentials',
					},
				});
			});
		});
	});

	describe('when email to short', () => {
		const setup = () => {
			const email = 't@example.com';
			const exception = new AuthenticationErrorLoggableException(new Error('testError'), email);

			return {
				email,
				exception,
			};
		};

		it('should mask the email correctly', () => {
			const { email, exception } = setup();

			const result = exception['maskEmail'](email);

			expect(result).toBe('t@e***');
		});
	});
});
