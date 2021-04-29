const { expect } = require('chai');
const appPromise = require('../../../../../src/app');
const { Configuration } = require('@hpi-schul-cloud/commons');

describe('ConfigServiceV2', () => {
	let app;
	let server;
	let configService;

	const envsToTest = ['ADMIN_TABLES_DISPLAY_CONSENT_COLUMN'];

	before(async () => {
		app = await appPromise;
		configService = app.service('/config/v2');
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
	});

	it('is properly registered', () => {
		expect(configService).to.not.equal(undefined);
	});

	it('returns environment variables', async () => {
		const serviceEnvs = await configService.find();
		const testEnvs = {};
		envsToTest.forEach((env) => (testEnvs[env] = Configuration.get(env)));
		expect(serviceEnvs).to.eql(testEnvs);
	});
});
