const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const oauth2 = require('simple-oauth2');
const request = require('request-promise-native');

const app = require('../../../src/app');
const logger = require('../../../src/logger/');

const baseUrlService = app.service('oauth2/baseUrl');
const clientsService = app.service('oauth2/clients');
const loginService = app.service('oauth2/loginRequest');
const introspectService = app.service('oauth2/introspect');
const consentService = app.service('oauth2/auth/sessions/consent');
const toolService = app.service('ltiTools');

chai.use(chaiHttp);

describe('oauth2 service', function oauthTest() {
	this.timeout(10000);

	const testUser2 = {
		_id: '0000d224816abba584714c9c',
	};

	const testClient = {
		client_id: 'unit_test',
		client_name: 'Unit Test Client',
		client_secret: 'xxxxxxxxxxxxx',
		redirect_uris: ['https://localhost:8888'],
		token_endpoint_auth_method: 'client_secret_basic',
		subject_type: 'pairwise',
	};

	const testClient2 = {
		client_id: 'unit_test_2',
		client_name: 'Unit Test Client',
		client_secret: 'xxxxxxxxxxxxx',
		redirect_uris: ['https://localhost:8888'],
		token_endpoint_auth_method: 'client_secret_basic',
		subject_type: 'pairwise',
	};

	const testTool1 = {
		_id: '5a79cb15c3874f9aea14daa5',
		name: 'test1',
		url: 'https://tool.com?pseudonym={PSEUDONYM}',
		isLocal: true,
		isTemplate: true,
		resource_link_id: 1,
		lti_version: '1p0',
		lti_message_type: 'basic-start-request',
		secret: '1',
		key: '1',
		oAuthClientId: testClient2.client_id,
	};

	const testTool2 = {
		_id: '5a79cb15c3874f9aea14daa6',
		originTool: '5a79cb15c3874f9aea14daa5',
		name: 'test2',
		url: 'https://tool.com?pseudonym={PSEUDONYM}',
		isLocal: true,
		resource_link_id: 1,
		lti_version: '1p0',
		lti_message_type: 'basic-start-request',
		secret: '1',
		key: '1',
	};

	let loginRequest1 = null;
	let loginRequest2 = null;

	before((done) => {
		this.timeout(10000);
		Promise.all([
			toolService.create(testTool1),
			toolService.create(testTool2),
		]).then(() => {
			clientsService
				.create(testClient2)
				.then((client) => {
					const oauth = oauth2.create({
						client: {
							id: client.client_id,
							secret: client.client_secret,
						},
						auth: {
							tokenHost: 'http://localhost:9000',
							tokenPath: '/oauth2/token',
							authorizePath: '/oauth2/auth',
						},
					});
					const authorizationUri = oauth.authorizationCode.authorizeURL(
						{
							redirect_uri: client.redirect_uris[0],
							scope: 'openid',
							state: '12345678',
						},
					);
					request({
						uri: authorizationUri,
						method: 'GET',
						followRedirect: false,
					}).catch((res) => {
						const position =								res.error.indexOf('login_challenge=')
								+ 'login_challenge'.length
								+ 1;
						loginRequest1 = res.error.substr(position, 32);
						request({
							uri: authorizationUri,
							method: 'GET',
							followRedirect: false,
						}).catch((res2) => {
							const position2 = res2.error.indexOf('login_challenge=')
									+ 'login_challenge'.length
									+ 1;
							loginRequest2 = res2.error.substr(
								position2,
								32,
							);
							done();
						});
					});
				})
				.catch((err) => {
					logger.warning(
						'Can not execute oauth2 before all hook.',
						err,
					);
					done();
				});
		});
	});

	after((done) => {
		Promise.all([
			toolService.remove(testTool1._id),
			toolService.remove(testTool2._id),
			clientsService.remove(testClient2.client_id),
		])
			.then(() => {
				done();
			})
			.catch((err) => {
				logger.warning(
					'Can not execute oauth2 after all hook.',
					err,
				);
				done();
			});
	});

	it('is registered', () => {
		assert.ok(clientsService);
		assert.ok(loginService);
	});

	it('GET BaseUrl', () => baseUrlService.find().then((response) => {
		assert.ok(response);
	}));

	it('CREATE Client', () => clientsService.create(testClient).then((result) => {
		assert.strictEqual(result.client_id, testClient.client_id);
	}));

	it('FIND Clients', () => clientsService.find().then((result) => {
		const foundTestClient = JSON.parse(result).find(
			(client) => client.client_id === testClient.client_id,
		);
		assert(foundTestClient);
	}));

	it('DELETE Client', () => clientsService.remove(testClient.client_id).then((result) => {
		assert(true);
	}));

	it('GET Login Request', () => loginService.get(loginRequest1).then((result) => {
		assert.strictEqual(result.challenge, loginRequest1);
	}));

	it('PATCH Login Request Accept', () => loginService
		.patch(
			loginRequest1,
			{},
			{
				query: { accept: 1 },
				account: { userId: testUser2._id },
			},
		)
		.then((result) => {
			// redirectTo = result.redirect_to;
			assert.ok(
				result.redirect_to.indexOf(testClient2.client_id) !== -1,
			);
		}));

	it('PATCH Login Request Reject', () => loginService
		.patch(
			loginRequest2,
			{},
			{
				query: { accept: 0 },
				account: { userId: '0000d224816abba584714c9c' },
			},
		)
		.then(() => {
			assert.ok(true);
		}));

	it('Introspect Inactive Token', () => introspectService.create({ token: 'xxx' }).then((res) => {
		assert(res.active === false);
	}));

	it('GET Consent', () => consentService
		.get(testUser2._id, {
			account: { userId: testUser2._id },
		})
		.then((consents) => {
			assert.ok(consents);
		}));

	it('REMOVE Consent', () => consentService
		.remove(testUser2._id, {
			account: { userId: testUser2._id },
			query: { client: testClient.client_id },
		})
		.then(() => {
			throw new Error('Was not supposed to succeed');
		})
		.catch((err) => {
			assert.strictEqual(404, err.statusCode);
		}));
});
