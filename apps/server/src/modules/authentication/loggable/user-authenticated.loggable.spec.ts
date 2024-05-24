import { UserAuthenticatedLoggable } from './user-authenticated.loggable';

describe(UserAuthenticatedLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const loggable = new UserAuthenticatedLoggable();

			return {
				loggable,
			};
		};

		it('should return the correct log message', () => {
			const { loggable } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'SUCCESSFULLY_AUTHENTICATED',
				data: {},
			});
		});
	});
});
