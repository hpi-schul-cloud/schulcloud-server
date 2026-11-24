import { isCredentialName, isSensitiveName } from './sensitive-value';

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
		it.each([
			'pin',
			'PIN',
			'Pin',
			'pinCode',
			'PINCode',
			'userPin',
			'userPIN',
			'pin_code',
			'PIN_CODE',
			'x-pin',
			'pin2',
			'pins',
			'Pins',
			'registrationPins',
			'userPINs',
			'USER_PINS',
			'pins_list',
		])('should match %s', (name) => {
			expect(isSensitiveName(name)).toBe(true);
		});
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
			'opinions',
			'spin',
			'spins',
			'PINSET',
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

describe('isCredentialName', () => {
	it.each(['resetId', 'resetid', 'RESET_ID', 'reset_id', 'reset-id', 'importHash', 'import_hash', 'IMPORTHASH'])(
		'should match the one-time token name %s',
		(name) => {
			expect(isCredentialName(name)).toBe(true);
			expect(isSensitiveName(name)).toBe(true);
		}
	);

	it.each(['reset', 'resetAt', 'hash', 'contentHash', 'importId', 'resetIdentifier'])('should not match %s', (name) => {
		expect(isCredentialName(name)).toBe(false);
		expect(isSensitiveName(name)).toBe(false);
	});

	it.each([
		'password',
		'searchUserPassword',
		'passwort_1',
		'passwd',
		'clientCredentials',
		'pin',
		'userPINs',
		'PIN_CODE',
	])('should match %s', (name) => {
		expect(isCredentialName(name)).toBe(true);
	});

	it.each(['accessToken', 'clientSecret', 'authorization', 'cookie', 'apiKey', 'x-api-client', 'pinned', 'spinner'])(
		'should not match %s',
		(name) => {
			expect(isCredentialName(name)).toBe(false);
		}
	);
});

describe('sensitive name checks on long crafted names', () => {
	// Field names come from request bodies; the word split must stay linear.
	it.each([
		['an upper-case run followed by a lower-case letter', `${'A'.repeat(100000)}a`],
		['alternating upper- and lower-case letters', 'Aa'.repeat(50000)],
		['a repeated PIN', 'PIN'.repeat(33334)],
		['a repeated plural PINs', 'PINs'.repeat(25000)],
	])('should check %s within 50 ms', (_description, name) => {
		const start = performance.now();

		isSensitiveName(name);
		isCredentialName(name);

		expect(performance.now() - start).toBeLessThan(50);
	});
});
