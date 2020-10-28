const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');

// proxyserver
const oauth2Server = require('./oauth2MockServer');
const oauth2 = require('../../../src/services/oauth2');

const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise);

chai.use(chaiHttp);

const { expect } = chai;

describe('oauth2 service mock', function oauthTest() {
	let app;
	let baseUrlService;
	let clientsService;
	let loginService;
	let introspectService;
	let consentService;
	let server;
	this.timeout(15000);

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

	let beforeHydraUri;
	before(async function before() {
		this.timeout(10000);
		app = await appPromise;

		baseUrlService = app.service('oauth2/baseUrl');
		clientsService = app.service('oauth2/clients');
		loginService = app.service('oauth2/loginRequest');
		introspectService = app.service('oauth2/introspect');
		consentService = app.service('oauth2/auth/sessions/consent');

		beforeHydraUri = app.settings.services.hydra;

		const o2mock = await oauth2Server({});
		app.settings.services.hydra = o2mock.url;

		app.configure(oauth2);
		server = await app.listen();
	});

	after(async () => {
		// sets uri back to original uri
		app.settings.services.hydra = beforeHydraUri;
		await server.close();
	});

	it('is registered', () => {
		assert.ok(clientsService);
		assert.ok(loginService);
		assert.ok(introspectService);
		assert.ok(consentService);
	});

	it('GET BaseUrl', () =>
		baseUrlService.find().then((response) => {
			assert.ok(response);
		}));

	it('CREATE Client', () =>
		app
			.service('oauth2/clients')
			.create(testClient)
			.then((result) => {
				assert.strictEqual(result.client_id, testClient.client_id);
			}));

	it('FIND Clients', () =>
		app
			.service('oauth2/clients/')
			.find()
			.then((result) => {
				const foundTestClient = JSON.parse(result).find((client) => client.client_id === testClient.client_id);
				assert(foundTestClient, foundTestClient.toString());
			}));

	it('DELETE Client', () =>
		app
			.service('oauth2/clients/')
			.remove(testClient.client_id)
			.then((result) => {
				assert(true);
			}));

	it('GET Login Request', async () => {
		const id = null;
		const result = await app.service('oauth2/loginRequest').get(id);
		expect(result).to.eql({ challenge: null, client: { client_id: 'thethingwearelookingfor' } });
	});

	it('PATCH Login Request Accept', async () => {
		const user = await testObjects.createTestUser();
		const ltiTool = await app.service('ltiTools').create({
			oAuthClientId: 'thethingwearelookingfor',
			url: 'someUrl',
			key: 'someKey',
			secret: 'someSecret',
			isLocal: true,
		});
		const pseudonym = await app.service('pseudonym').create({
			userId: user._id,
			tooldId: ltiTool._id,
			pseudonym: 'somePseudonym',
		});
		const results = await app.service('oauth2/loginRequest').patch(
			null,
			{},
			{
				query: { accept: 1 },
				account: { userId: testUser2._id },
			}
		);
		assert.ok(results.redirect_to.includes(testClient2.client_id));
		app.service('pseudonym').remove(pseudonym._id);
		app.service('ltiTools').remove(ltiTool._id);
	});

	/* fix this test, but not sure if the expect result what we want */
	it('PATCH Login Request Reject', async () => {
		const id = null;
		const data = {};
		const params = {
			query: { accept: 0 },
			account: { userId: '0000d224816abba584714c9c' },
		};

		const result = await app.service('oauth2/loginRequest').patch(id, data, params);
		expect(result).to.eql({ client_id: null });
	});

	it('Introspect Inactive Token', () =>
		app
			.service('oauth2/introspect')
			.create({ token: 'xxx' })
			.then((res) => {
				assert(res.active === false);
			}));

	it('GET Consent', () =>
		app
			.service('oauth2/auth/sessions/consent')
			.get(testUser2._id, {
				account: { userId: testUser2._id },
			})
			.then((consents) => {
				assert.ok(consents);
			}));

	it('REMOVE Consent', () =>
		app
			.service('oauth2/auth/sessions/consent')
			.remove(testUser2._id, {
				account: { userId: testUser2._id },
				query: { client: testClient.client_id },
			})
			.then((res) => {
				throw new Error('Should not supposed to succeed');
			})
			.catch((err) => {
				assert.strictEqual(404, err.statusCode);
			}));
});
