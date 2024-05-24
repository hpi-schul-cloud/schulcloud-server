import { AccountNotFoundLoggableException } from './account-not-found.loggable-exception';

describe(AccountNotFoundLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new AccountNotFoundLoggableException();

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
