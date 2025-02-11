const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');

const appPromise = require('../../../src/app');

chai.use(chaiHttp);

describe('hydra service', function oauthTest() {
	let app;
	let clientsService;
	let introspectService;
	let server;
	this.timeout(10000);

	const testClient = {
		client_id: 'unit_test',
		client_name: 'Unit Test Client',
		client_secret: 'xxxxxxxxxxxxx',
		redirect_uris: ['https://localhost:8888'],
		token_endpoint_auth_method: 'client_secret_basic',
		subject_type: 'pairwise',
	};

	before(async () => {
		app = await appPromise();
		introspectService = app.service('oauth2/introspect');
		this.timeout(10000);

		server = await app.listen();
	});

	after(async () => {
		await Promise.all([clientsService.remove(testClient.client_id)]);
		await server.close();
	});

	it('Introspect Inactive Token', () =>
		introspectService.create({ token: 'xxx' }).then((res) => {
			assert(res.active === false);
		}));
});
