const { expect } = require('chai');

const errorHandler = require('../../src/middleware/errorHandler');

const { isSecretDataKey } = errorHandler;

const getFilterSecretsMiddleware = () => {
	const middlewares = [];
	errorHandler({ use: (middleware) => middlewares.push(middleware) });

	return middlewares.find((middleware) => middleware.name === 'filterSecrets');
};

describe('errorHandler', () => {
	describe('isSecretDataKey', () => {
		// The fixed list used before the shared sensitive name rule; every entry must stay covered.
		const previousSecretDataKeys = [
			'headers',
			'password',
			'passwort',
			'new_password',
			'new-password',
			'oauth-password',
			'current-password',
			'passwort_1',
			'passwort_2',
			'password_1',
			'password_2',
			'password-1',
			'password-2',
			'password_verification',
			'password_control',
			'PASSWORD_HASH',
			'password_new',
			'accessToken',
			'ticket',
			'firstName',
			'lastName',
			'email',
			'birthday',
			'description',
			'gradeComment',
			'_csrf',
			'searchUserPassword',
			'authorization',
			'student-email',
			'toHash',
		];

		previousSecretDataKeys.forEach((key) => {
			it(`should still treat ${key} as secret`, () => {
				expect(isSecretDataKey(key)).to.equal(true);
				expect(isSecretDataKey(key.toUpperCase())).to.equal(true);
			});
		});

		['passwordHash', 'clientSecret', 'refresh_token', 'cookie', 'x-api-key', 'credentials', 'pin', 'userPin'].forEach(
			(key) => {
				it(`should treat ${key} as secret through the shared rule`, () => {
					expect(isSecretDataKey(key)).to.equal(true);
				});
			}
		);

		['_id', 'name', 'schoolId', 'pinned', 'spinner', 'mapping'].forEach((key) => {
			it(`should not treat ${key} as secret`, () => {
				expect(isSecretDataKey(key)).to.equal(false);
			});
		});
	});

	describe('filterSecrets', () => {
		it('should replace secret values in the request body and error data', () => {
			const filterSecrets = getFilterSecretsMiddleware();
			const error = new Error('test');
			error.data = { userPin: '1234', nested: { clientSecret: 'abc', schoolId: 'school' } };
			const req = {
				originalUrl: '/users',
				headers: { cookie: 'jwt=abc', 'content-type': 'application/json' },
				body: { passwordHash: 'hash', email: 'someone@example.com', forcePasswordChange: true, name: 'test' },
			};
			let nextError;

			filterSecrets(error, req, {}, (err) => {
				nextError = err;
			});

			expect(nextError).to.equal(error);
			expect(error.data).to.deep.equal({
				userPin: '<secret>',
				nested: { clientSecret: '<secret>', schoolId: 'school' },
			});
			expect(req.headers).to.deep.equal({ cookie: '<secret>', 'content-type': 'application/json' });
			expect(req.body).to.deep.equal({
				passwordHash: '<secret>',
				email: 'som****@example.com',
				forcePasswordChange: true,
				name: 'test',
			});
		});

		it('should replace the password recovery token and the registration hash in the request body', () => {
			const filterSecrets = getFilterSecretsMiddleware();
			const req = {
				originalUrl: '/passwordRecovery/reset',
				headers: {},
				body: { resetId: 'recovery-token', password: 'weak', importHash: 'import-hash', schoolId: 'school' },
			};

			filterSecrets(new Error('test'), req, {}, () => {});

			expect(req.body).to.deep.equal({
				resetId: '<secret>',
				password: '<secret>',
				importHash: '<secret>',
				schoolId: 'school',
			});
		});
	});
});
