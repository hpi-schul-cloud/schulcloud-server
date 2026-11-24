import { isSensitiveName } from './sensitive-value';

describe('isSensitiveName', () => {
	describe('when a name contains cookie, auth, token or secret', () => {
		it.each([
			'cookie',
			'Set-Cookie',
			'authorization',
			'Authorization',
			'x-auth-token',
			'oauth-password',
			'accessToken',
			'access_token',
			'refresh_token',
			'id_token',
			'clientSecret',
			'client_secret',
			'SECRET_ACCESS_KEY',
		])('should match %s', (name) => {
			expect(isSensitiveName(name)).toBe(true);
		});
	});

	describe('when a name points to an API key', () => {
		it.each(['apiKey', 'api_key', 'api-key', 'X-API-KEY', 'x-api-client', 'providerApiKey'])(
			'should match %s',
			(name) => {
				expect(isSensitiveName(name)).toBe(true);
			}
		);

		it.each(['key', 'accessKeyId', 'versionKey', 'publicKey'])('should not match %s', (name) => {
			expect(isSensitiveName(name)).toBe(false);
		});
	});

	describe('when a name contains password, passwort or passwd', () => {
		it.each([
			'password',
			'PASSWORD',
			'searchUserPassword',
			'new_password',
			'new-password',
			'current-password',
			'password_1',
			'password-2',
			'password_verification',
			'password_control',
			'PASSWORD_HASH',
			'password_new',
			'passwordHash',
			'forcePasswordChange',
			'passwort',
			'passwort_1',
			'neuesPasswort',
			'passwd',
			'passwdFile',
		])('should match %s', (name) => {
			expect(isSensitiveName(name)).toBe(true);
		});
	});

	describe('when a name contains credential', () => {
		it.each(['credential', 'credentials', 'clientCredentials', 'credentialsId', 'CREDENTIAL_FILE', 'aws-credential'])(
			'should match %s',
			(name) => {
				expect(isSensitiveName(name)).toBe(true);
			}
		);
	});

	describe('when a name contains pin as a word', () => {
		it.each(['pin', 'PIN', 'Pin', 'pinCode', 'PINCode', 'userPin', 'userPIN', 'pin_code', 'PIN_CODE', 'x-pin', 'pin2'])(
			'should match %s',
			(name) => {
				expect(isSensitiveName(name)).toBe(true);
			}
		);
	});

	describe('when pin is only part of a longer word', () => {
		it.each([
			'pinned',
			'isPinned',
			'PINNED',
			'pinnedAt',
			'spinner',
			'showSpinner',
			'mapping',
			'fieldMapping',
			'shipping',
			'pinboard',
			'pincode',
			'opinion',
			'spin',
		])('should not match %s', (name) => {
			expect(isSensitiveName(name)).toBe(false);
		});
	});

	describe('when a name is not sensitive', () => {
		it.each(['id', 'name', 'email', 'firstName', 'schoolId', 'url', 'method', 'status'])(
			'should not match %s',
			(name) => {
				expect(isSensitiveName(name)).toBe(false);
			}
		);
	});
});
