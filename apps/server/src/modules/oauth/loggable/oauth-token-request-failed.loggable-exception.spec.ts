import { OauthTokenRequestFailedLoggableException } from './oauth-token-request-failed.loggable-exception';

describe('OauthTokenRequestFailedLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const exception = new OauthTokenRequestFailedLoggableException();

			return {
				exception,
			};
		};

		it('should return the correct log message', () => {
			const { exception } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'OAUTH_TOKEN_REQUEST_FAILED',
				message: 'OAuth token request failed.',
				stack: expect.any(String),
			});
		});
	});
});
