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

		it('should not change nested objects of the error, but log copies with the secrets replaced', () => {
			const filterSecrets = getFilterSecretsMiddleware();
			const providerConfig = { clientId: 'client', clientSecret: 'real-client-secret' };
			const system = { alias: 'idp', providerConfig, scopes: [{ token: 'real-token' }] };
			const error = new Error('test');
			error.data = { system };
			const req = { originalUrl: '/systems', headers: {}, body: {} };

			filterSecrets(error, req, {}, () => {});

			expect(error.data.system.providerConfig).to.deep.equal({ clientId: 'client', clientSecret: '<secret>' });
			expect(error.data.system.scopes).to.deep.equal([{ token: '<secret>' }]);
			expect(Array.isArray(error.data.system.scopes)).to.equal(true);
			expect(providerConfig.clientSecret).to.equal('real-client-secret');
			expect(system.scopes[0].token).to.equal('real-token');
			expect(system.providerConfig).to.equal(providerConfig);
		});

		it('should keep objects without secrets as they are', () => {
			const filterSecrets = getFilterSecretsMiddleware();
			const context = { schoolId: 'school' };
			const error = new Error('test');
			error.data = { context };

			filterSecrets(error, { originalUrl: '/', headers: {}, body: {} }, {}, () => {});

			expect(error.data.context).to.equal(context);
		});

		it('should replace secrets in circular objects without changing them', () => {
			const filterSecrets = getFilterSecretsMiddleware();
			const config = { clientSecret: 'real-client-secret' };
			config.self = config;
			const error = new Error('test');
			error.data = { config };

			filterSecrets(error, { originalUrl: '/', headers: {}, body: {} }, {}, () => {});

			expect(error.data.config.clientSecret).to.equal('<secret>');
			expect(error.data.config.self).to.equal(error.data.config);
			expect(config.clientSecret).to.equal('real-client-secret');
			expect(config.self).to.equal(config);
		});

		it('should keep the prototype of a wrapped error and not change its nested objects', () => {
			const filterSecrets = getFilterSecretsMiddleware();
			class WrappedError extends Error {}
			const requestOptions = { auth: { password: 'real-password' }, uri: 'https://example.org' };
			const wrapped = new WrappedError('inner');
			wrapped.requestOptions = requestOptions;
			const error = new Error('outer');
			error.error = wrapped;

			filterSecrets(error, { originalUrl: '/', headers: {}, body: {} }, {}, () => {});

			expect(error.error).to.equal(wrapped);
			expect(error.error).to.be.instanceOf(WrappedError);
			expect(error.error.requestOptions).to.deep.equal({ auth: '<secret>', uri: 'https://example.org' });
			expect(requestOptions.auth.password).to.equal('real-password');
		});
	});
});
