const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../../../src/app');
const { exposedVars } = require('../../../../../src/services/config/publicAppConfigService');

describe('PublicAppConfigService', () => {
	let app;
	let server;
	let configService;

	before(async () => {
		app = await appPromise;
		configService = app.service('/config/app/public');
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
	});

	it('is properly registered', () => {
		expect(configService).to.not.equal(undefined);
	});

	it('returns the right environment variables', async () => {
		const serviceEnvs = await configService.find();
		const testEnvs = {};
		// eslint-disable-next-line no-return-assign
		exposedVars.forEach((env) => (testEnvs[env] = Configuration.get(env)));
		expect(serviceEnvs).to.eql(testEnvs);
	});
});
