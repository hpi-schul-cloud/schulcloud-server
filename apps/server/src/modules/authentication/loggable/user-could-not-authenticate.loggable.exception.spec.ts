import { UserCouldNotAuthenticateLoggableException } from './user-could-not-authenticate.loggable.exception';

describe(UserCouldNotAuthenticateLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new UserCouldNotAuthenticateLoggableException();

			return {
				exception,
			};
		};

		it('should return the correct log message', () => {
			const { exception } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'UNAUTHORIZED_EXCEPTION',
				stack: expect.any(String),
				data: {},
			});
		});
	});
});
