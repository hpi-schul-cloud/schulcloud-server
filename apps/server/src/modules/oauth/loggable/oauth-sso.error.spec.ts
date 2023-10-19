import { OAuthSSOError } from './oauth-sso.error';

describe('Oauth SSO Error', () => {
	it('should be possible to create', () => {
		const error = new OAuthSSOError();
		expect(error).toBeDefined();
		expect(error.message).toEqual(error.DEFAULT_MESSAGE);
		expect(error.errorcode).toEqual(error.DEFAULT_ERRORCODE);
	});

	it('should be possible to add message', () => {
		const msg = 'test message';
		const error = new OAuthSSOError(msg);
		expect(error.message).toEqual(msg);
	});

	it('should have the right code', () => {
		const errCode = 'test_code';
		const error = new OAuthSSOError('', errCode);
		expect(error.errorcode).toEqual(errCode);
	});
});
