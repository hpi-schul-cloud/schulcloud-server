import { LdapUserCouldNotBeAuthenticatedLoggableException } from './user-could-not-be-authenticated.loggable.exception';

describe(LdapUserCouldNotBeAuthenticatedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const err = new Error('test');
			const exception = new LdapUserCouldNotBeAuthenticatedLoggableException(err);

			return {
				exception,
				err,
			};
		};

		it('should return the correct log message', () => {
			const { err, exception } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'UNAUTHORIZED_EXCEPTION',
				stack: expect.any(String),
				data: { error: JSON.stringify(err) },
			});
		});
	});
});
