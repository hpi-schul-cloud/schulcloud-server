import { UserAuthenticatedLoggable } from './user-authenticated.loggable';

describe(UserAuthenticatedLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new UserAuthenticatedLoggable();

			return {
				exception,
			};
		};

		it('should return the correct log message', () => {
			const { exception } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'SUCCESSFULLY_AUTHENTICATED',
				stack: expect.any(String),
				data: {},
			});
		});
	});
});
