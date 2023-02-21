import { OAuthMigrationError } from './oauth-migration.error';

describe('Oauth Migration Error', () => {
	it('should be possible to create', () => {
		const error = new OAuthMigrationError();
		expect(error).toBeDefined();
		expect(error.message).toEqual(error.DEFAULT_MESSAGE);
		expect(error.errorcode).toEqual(error.DEFAULT_ERRORCODE);
	});

	it('should be possible to add message', () => {
		const msg = 'test message';
		const error = new OAuthMigrationError(msg);
		expect(error.message).toEqual(msg);
	});

	it('should have the right code', () => {
		const errCode = 'test_code';
		const error = new OAuthMigrationError('', errCode);
		expect(error.errorcode).toEqual(errCode);
	});
});
