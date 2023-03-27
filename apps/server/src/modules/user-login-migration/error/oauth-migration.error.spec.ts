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

	it('should create with specific parameter', () => {
		const error = new OAuthMigrationError(undefined, undefined, '12345', '11111');
		expect(error).toBeDefined();
		expect(error.message).toEqual(error.DEFAULT_MESSAGE);
		expect(error.errorcode).toEqual(error.DEFAULT_ERRORCODE);
		expect(error.officialSchoolNumberFromSource).toEqual('12345');
		expect(error.officialSchoolNumberFromTarget).toEqual('11111');
	});
});
