import { ShdUserCreateTokenLoggable } from './shd-user-create-token.loggable';

describe(ShdUserCreateTokenLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const loggable = new ShdUserCreateTokenLoggable('supportUserId', 'targetUserId', 10);

			return {
				loggable,
			};
		};

		it('should return the correct log message', () => {
			const { loggable } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: `The support employee with the Id supportUserId has created  a short live JWT for the user with the Id targetUserId. The JWT expires expires in 0.16666666666666666 minutes`,
				data: {},
			});
		});
	});
});
