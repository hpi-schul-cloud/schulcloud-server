import { OauthSsoErrorLoggableException } from './oauth-sso-error-loggable-exception';

describe(OauthSsoErrorLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new OauthSsoErrorLoggableException();

			return {
				exception,
			};
		};

		it('should return a LogMessage', () => {
			const { exception } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'SSO_LOGIN_FAILED',
				message: 'Internal Server Error',
				stack: expect.any(String),
			});
		});
	});
});
