import { InvalidOauthSignatureLoggableException } from './invalid-oauth-signature.loggable-exception';

describe(InvalidOauthSignatureLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const loggable = new InvalidOauthSignatureLoggableException();

			return {
				loggable,
			};
		};

		it('should return a loggable message', () => {
			const { loggable } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'INVALID_OAUTH_SIGNATURE',
				message: 'The oauth signature is invalid.',
				stack: loggable.stack,
			});
		});
	});
});
