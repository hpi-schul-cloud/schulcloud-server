import { UserAccountDeactivatedException } from './user-account-deactivated-exception';

describe(UserAccountDeactivatedException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new UserAccountDeactivatedException();

			return {
				exception,
			};
		};

		it('should return the correct log message', () => {
			const { exception } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'USER_ACCOUNT_DEACTIVATED',
				stack: expect.any(String),
			});
		});
	});
});
