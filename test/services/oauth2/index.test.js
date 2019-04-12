const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const oauth2 = require('simple-oauth2');
const request = require('request-promise-native');

const app = require('../../../src/app');

const clientsService = app.service('oauth2/clients');
const loginService = app.service('oauth2/loginRequest');
const introspectService = app.service('oauth2/introspect');
const consentService = app.service('oauth2/auth/sessions/consent');
const toolService = app.service('ltiTools');

const expect = chai.expect;
chai.use(chaiHttp);

describe('oauth2 service', function oauth() {
	this.timeout(10000);

	const testUser1 = {
		_id: '0000d231816abba584714c9e',
	};
	const testUser2 = {
		_id: '0000d224816abba584714c9c',
	};
	const testUser3 = {
		_id: '0000d213816abba584714c0a',
	};

	const testClient = {
		"client_id": "unit_test",
		"client_name": "Unit Test Client",
		"client_secret": "xxxxxxxxxxxxx",
		"redirect_uris": [
			"https://localhost:8888"
		],
		"token_endpoint_auth_method": "client_secret_basic",
		"subject_type": "pairwise"
	}

	const testClient2 = {
		"client_id": "unit_test_2",
		"client_name": "Unit Test Client",
		"client_secret": "xxxxxxxxxxxxx",
		"redirect_uris": [
			"https://localhost:8888"
		],
		"token_endpoint_auth_method": "client_secret_basic",
		"subject_type": "pairwise"
	}

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
	let redirectTo = null;

	before((done) => {
		this.timeout(10000);
		Promise.all([
			toolService.create(testTool1),
			toolService.create(testTool2),
		]).then(() => {
				clientsService.create(testClient2).then((client) => {
					const oauth = oauth2.create({client: {
							id: client.client_id,
							secret: client.client_secret,
						},
						auth: {
							tokenHost: 'http://localhost:9000',
							tokenPath: '/oauth2/token',
							authorizePath: '/oauth2/auth',
						}});
					const authorizationUri = oauth.authorizationCode.authorizeURL({
						redirect_uri: client.redirect_uris[0],
						scope: 'openid',
						state: '12345678',
					});
					chai.request(authorizationUri)
						.get('')
						.set('content-type', 'application/json')
						.end((err, res) => {
							const position = res.redirects[0].indexOf("login_challenge=") +
								"login_challenge".length + 1;
							loginRequest1 = res.redirects[0].substr(position);
							chai.request(authorizationUri)
								.get('')
								.set('content-type', 'application/json')
								.end((err, res) => {
									const position = res.redirects[0].indexOf("login_challenge=") +
										"login_challenge".length + 1;
									loginRequest2 = res.redirects[0].substr(position);
									done();
								})
						})
				})
		});
	});

	after((done) => {
		Promise.all([
			toolService.remove(testTool1),
			toolService.remove(testTool2),
			clientsService.remove(testClient2.client_id),
		]).then((results) => {
			done();
		});
	});

	it('is registered', () => {
		assert.ok(clientsService);
		assert.ok(loginService);
	});

	it('CREATE Client', () => clientsService.create(testClient).then((result) => {
		assert.strictEqual(result.client_id, testClient.client_id);
	}));

	it('FIND Clients', () => clientsService.find().then((result) => {
		const foundTestClient = JSON.parse(result)
			.find(client => (client.client_id === testClient.client_id));
		assert(foundTestClient);
	}));

	it('DELETE Client', () => clientsService.remove(testClient.client_id).then((result) => {
		assert(true);
	}));

	it('GET Login Request', () => loginService.get(loginRequest1).then((result) => {
		assert.strictEqual(result.challenge, loginRequest1);
	}));

	it('PATCH Login Request Accept', () => loginService.patch(loginRequest1, null, {
		query: { accept: 1 },
		account: { userId: testUser2._id },
	}).then((result) => {
		redirectTo = result.redirect_to;
		assert.ok(result.redirect_to.indexOf(testClient2.client_id) !== -1);
	}));

	it('PATCH Login Request Reject', () => loginService.patch(loginRequest2, null, {
		query: { accept: 0 },
		account: { userId: '0000d224816abba584714c9c' },
	}).then(() => {
		assert.ok(true);
	}));

	// it('GET and PATCH Consent Request', (done) => {
	// 	return request({
	// 		uri: redirectTo,
	// 		method: 'GET',
	// 		followRedirect: false,
	// 	}).then(response => {
	// 		console.log(response);
	// 		assert.ok(true);
	// 		done();
	// 	}).catch(err => {
	// 		console.log(err);
	// 	});
	// });

	it('Introspect Inactive Token', () => introspectService.create({token: "xxx"}).then((res) => {
		assert((res.active === false));
	}));

	it('GET Consent', () => consentService.get(testUser2._id, {
		account: { userId: testUser2._id }
	}).then((consents) => {
		assert.ok(consents);
	}));

	it('REMOVE Consent', () => consentService.remove(testUser2._id, {
		account: { userId: testUser2._id },
		query: { client: testClient.client_id }
	}).then(() => {
		throw new Error('Was not supposed to succeed');
	}).catch((err) => {
		assert.strictEqual(404, err.statusCode);
	}));

});
