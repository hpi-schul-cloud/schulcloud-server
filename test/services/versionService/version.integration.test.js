const chai = require('chai');
const chaiHttp = require('chai-http');
const commons = require('@hpi-schul-cloud/commons');

const { Configuration } = commons;

chai.use(chaiHttp);
const { expect } = chai;

describe('version service integration tests', function test() {
	let app;
	let server;
	let configBefore;

	before(async () => {
		delete require.cache[require.resolve('../../../src/app')];
		configBefore = Configuration.toObject({ plainSecrets: true });
		Configuration.set('FEATURE_API_VALIDATION_ENABLED', true);
		Configuration.set('FEATURE_API_RESPONSE_VALIDATION_ENABLED', true);
		// eslint-disable-next-line global-require
		const appPromise = require('../../../src/app');
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
		Configuration.reset(configBefore);
	});

	describe('API tests', () => {
		it('When an unauthenticated user tries to access the version route, and FEATURE_SHOW_VERSION_ENABLED is activated, then the call returns as 200 with data', async () => {
			Configuration.set('FEATURE_SHOW_VERSION_ENABLED', true);
			const request = chai
				.request(app)
				.get('/version')
				.set('Accept', 'application/json')
				.set('content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(200);
			expect(response.body).to.haveOwnProperty('version');
		});

		it('When an unauthenticated user tries to access the version route, and FEATURE_SHOW_VERSION_ENABLED is deactivated, then the call returns as 405', async () => {
			Configuration.set('FEATURE_SHOW_VERSION_ENABLED', false);
			const request = chai
				.request(app)
				.get('/version')
				.set('Accept', 'application/json')
				.set('content-type', 'application/json');
			const response = await request.send();
			expect(response.status).to.equal(405);
		});
	});
});
