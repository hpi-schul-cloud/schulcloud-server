const { expect } = require('chai');
const util = require('util');

const logger = require('../../src/logger');

const errorHandler = require('../../src/middleware/errorHandler');
const { ValidationError, AssertionError } = require('../../src/errors');
const { API_VALIDATION_ERROR_TYPE } = require('../../src/errors/commonErrorTypes');

const { isSecretDataKey } = errorHandler;

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

	describe('when an error is handled', () => {
		const runErrorHandler = (error, req) => {
			const logged = [];
			const originalError = logger.error;
			logger.error = (...args) => logged.push(args);
			const response = {};
			const res = {
				status: (code) => {
					response.status = code;
					return res;
				},
				json: (body) => {
					response.body = body;
					return res;
				},
			};

			try {
				let current = error;
				const middlewares = [];
				errorHandler({ use: (middleware) => middlewares.push(middleware) });
				middlewares.forEach((middleware) => {
					middleware(current, req, res, (err) => {
						current = err;
					});
				});
			} finally {
				logger.error = originalError;
			}

			expect(logged).to.have.lengthOf(1);

			return { entry: logged[0][0], response };
		};

		const createRequest = (body = {}) => ({ originalUrl: '/users', method: 'POST', headers: {}, body });

		it('should mask secrets in the log entry and keep other values', () => {
			const error = new Error('test');
			error.details = { userPin: '1234', nested: { clientSecret: 'abc', schoolId: 'school' } };
			const req = createRequest({
				passwordHash: 'hash',
				email: 'someone@example.com',
				forcePasswordChange: true,
				name: 'test',
			});

			const { entry } = runErrorHandler(error, req);

			expect(entry.data).to.deep.equal({
				passwordHash: '<secret>',
				email: 'som****@example.com',
				forcePasswordChange: true,
				name: 'test',
			});
			expect(entry.details).to.deep.equal({
				userPin: '<secret>',
				nested: { clientSecret: '<secret>', schoolId: 'school' },
			});
			expect(error.details).to.deep.equal({ userPin: '1234', nested: { clientSecret: 'abc', schoolId: 'school' } });
			expect(req.body.passwordHash).to.equal('hash');
		});

		it('should mask the password recovery token and the registration hash in the request body', () => {
			const req = createRequest({
				resetId: 'recovery-token',
				password: 'weak',
				importHash: 'import-hash',
				schoolId: 'school',
			});

			const { entry } = runErrorHandler(new Error('test'), req);

			expect(entry.data).to.deep.equal({
				resetId: '<secret>',
				password: '<secret>',
				importHash: '<secret>',
				schoolId: 'school',
			});
		});

		it('should mask an email-like password completely and keep email masking for email fields', () => {
			const req = createRequest({
				password: 'Sommer@2026.de',
				userPin: 'pin@example.org',
				email: 'someone@example.com',
				'student-email': 'student@example.com',
			});

			const { entry } = runErrorHandler(new Error('test'), req);

			expect(entry.data).to.deep.equal({
				password: '<secret>',
				userPin: '<secret>',
				email: 'som****@example.com',
				'student-email': 'stu****@example.com',
			});
		});

		it('should mask an axios config that is shared by error.config and error.response.config on both paths', () => {
			const config = {
				url: 'https://idp.example.org/token',
				auth: { username: 'client', password: 'real-password' },
				headers: { Authorization: 'Basic real-basic-credentials' },
			};
			const error = new Error('Request failed');
			error.isAxiosError = true;
			error.config = config;
			error.response = { status: 500, config, data: { message: 'failed' } };

			const { entry } = runErrorHandler(error, createRequest());

			expect(entry.config.auth).to.equal('<secret>');
			expect(entry.config.headers).to.equal('<secret>');
			expect(entry.response.config).to.equal(entry.config);
			const output = util.inspect(entry, { depth: 20 });
			expect(output).to.not.contain('real-password');
			expect(output).to.not.contain('real-basic-credentials');
			expect(config.auth.password).to.equal('real-password');
			expect(config.headers.Authorization).to.equal('Basic real-basic-credentials');
			expect(error.response.config).to.equal(config);
		});

		it('should leave the original error, request options and agents unchanged', () => {
			const agent = { sockets: { 'auth.example.org:443:': ['socket'] }, options: { keepAlive: true } };
			const options = { uri: 'https://auth.example.org/token', auth: { bearer: 'real-token' }, agent };
			const details = { accessToken: 'real-access-token', schoolId: 'school' };
			const error = new Error('Request failed');
			error.options = options;
			error.details = details;
			const wrapped = new Error('inner');
			wrapped.options = options;
			error.error = wrapped;
			const body = { password: 'real-password' };
			const req = createRequest(body);

			const { entry } = runErrorHandler(error, req);

			expect(entry.options.auth).to.equal('<secret>');
			expect(entry.options.agent.sockets['auth.example.org:443:']).to.equal('<secret>');
			expect(entry.details.accessToken).to.equal('<secret>');
			expect(entry.error).to.be.instanceOf(Error);
			expect(entry.error.message).to.equal('inner');
			expect(entry.error.options).to.equal(entry.options);
			expect(error.options).to.equal(options);
			expect(options.auth).to.deep.equal({ bearer: 'real-token' });
			expect(agent.sockets).to.deep.equal({ 'auth.example.org:443:': ['socket'] });
			expect(error.details).to.equal(details);
			expect(details.accessToken).to.equal('real-access-token');
			expect(error.error).to.equal(wrapped);
			expect(req.body).to.equal(body);
			expect(body.password).to.equal('real-password');
		});

		it('should keep objects without secrets as they are', () => {
			const context = { schoolId: 'school', createdAt: new Date(0) };
			const error = new Error('test');
			error.details = { context };

			const { entry } = runErrorHandler(error, createRequest());

			expect(entry.details.context).to.equal(context);
		});

		it('should mask circular objects', () => {
			const config = { clientSecret: 'real-client-secret' };
			config.self = config;
			const error = new Error('test');
			error.details = { config };

			const { entry } = runErrorHandler(error, createRequest());

			expect(entry.details.config.clientSecret).to.equal('<secret>');
			expect(entry.details.config.self).to.equal(entry.details.config);
			expect(config.clientSecret).to.equal('real-client-secret');
			expect(config.self).to.equal(config);
		});

		it('should replace values nested deeper than the depth limit', () => {
			const error = new Error('test');
			let nested = { password: 'real-password' };
			for (let level = 0; level < 15; level += 1) {
				nested = { nested };
			}
			error.details = nested;

			const { entry } = runErrorHandler(error, createRequest());

			const output = util.inspect(entry, { depth: null });
			expect(output).to.contain('<max level exceeded>');
			expect(output).to.not.contain('real-password');
		});

		it('should mask the validation errors in the response without changing the error', () => {
			const params = { password: { message: 'too weak', value: 'real-password' }, name: 'test' };
			const error = new ValidationError(API_VALIDATION_ERROR_TYPE, params);

			const { response } = runErrorHandler(error, createRequest());

			expect(response.status).to.equal(400);
			expect(response.body.validation_errors).to.deep.equal({ password: '<secret>', name: 'test' });
			expect(error.params).to.equal(params);
			expect(params.password.value).to.equal('real-password');
		});

		it('should mask the assertion errors in the response', () => {
			const params = { apiKey: 'real-api-key', field: 'schoolId' };
			const error = new AssertionError(params);

			const { response } = runErrorHandler(error, createRequest());

			expect(response.body.assertion_errors).to.deep.equal({ apiKey: '<secret>', field: 'schoolId' });
		});
	});
});
