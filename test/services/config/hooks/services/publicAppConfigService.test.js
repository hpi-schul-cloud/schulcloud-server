const { expect } = require('chai');
const appPromise = require('../../../../../src/app');
const { Configuration } = require('@hpi-schul-cloud/commons');

describe('PublicAppConfigService', () => {
	let app;
	let server;
	let configService;

	const envsToTest = [
		'ADMIN_TABLES_DISPLAY_CONSENT_COLUMN',
		'FALLBACK_DISABLED',
		'JWT_SHOW_TIMEOUT_WARNING_SECONDS',
		'JWT_TIMEOUT_SECONDS',
		'FEATURE_EXTENSIONS_ENABLED',
		'FEATURE_TEAMS_ENABLED',
		'NOT_AUTHENTICATED_REDIRECT_URL',
		'FEATURE_ES_COLLECTIONS_ENABLED'
	];

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

	it('returns environment variables', async () => {
		const serviceEnvs = await configService.find();
		const testEnvs = {};
		envsToTest.forEach((env) => (testEnvs[env] = Configuration.get(env)));
		expect(serviceEnvs).to.eql(testEnvs);
	});
});
