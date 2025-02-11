const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { Configuration } = require('@hpi-schul-cloud/commons');
// proxyserver
const oauth2Server = require('./oauth2MockServer');
const oauth2 = require('../../../src/services/oauth2');

const appPromise = require('../../../src/app');
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');

chai.use(chaiHttp);

describe('oauth2 service mock', function oauthTest() {
	let app;
	let introspectService;
	let server;
	let nestServices;
	this.timeout(15000);

	let beforeHydraUri;
	before(async function before() {
		this.timeout(10000);

		beforeHydraUri = Configuration.get('HYDRA_URI');

		const o2mock = await oauth2Server({});
		Configuration.set('HYDRA_URI', o2mock.url);

		app = await appPromise();

		introspectService = app.service('oauth2/introspect');

		app.unuse('oauth2/introspect');

		app.configure(oauth2);
		server = await app.listen();
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		// sets uri back to original uri
		Configuration.set('HYDRA_URI', beforeHydraUri);
		await server.close();
		await closeNestServices(nestServices);
	});

	it('Introspect Inactive Token', () =>
		app
			.service('oauth2/introspect')
			.create({ token: 'xxx' })
			.then((res) => {
				assert(res.active === false);
			}));
});
