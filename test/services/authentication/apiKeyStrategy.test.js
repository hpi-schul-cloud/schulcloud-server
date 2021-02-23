const { expect } = require('chai');
const { authenticate } = require('@feathersjs/authentication');
const { Configuration } = require('@hpi-schul-cloud/commons');

const appPromise = require('../../../src/app');

class TestService {
	find(params) {
		return Promise.resolve({ success: true, params });
	}

	setup(localApp) {
		this.app = localApp;
	}
}

const testServiceHooks = {
	before: { all: [authenticate('api-key')] },
};

describe('api-key authentication strategy', () => {
	let app;
	let server;
	const testRoute = `/foo${Date.now}`;
	let configBefore = null;

	before(async () => {
		app = await appPromise;
		app.use(testRoute, new TestService());
		app.service(testRoute).hooks(testServiceHooks);
		server = await app.listen(0);
		configBefore = Configuration.toObject({ plainSecrets: true });
		Configuration.set('CALENDAR_API_KEY', 'validKey');
	});

	after(async () => {
		Configuration.reset(configBefore);
		await server.close();
	});

	it('authenticates valid API-Key', async () => {
		const result = await app.service(testRoute).find({
			authentication: { strategy: 'api-key', apiKey: 'validKey', route: 'resolve' },
		});
		expect(result).to.not.be.undefined;
		expect(result.success).to.eq(true);
		expect(result.params.authenticated).to.eq(true);
	});

	it('denies valid API-Key for other routes', async () => {
		try {
			await app.service(testRoute).find({
				authentication: { strategy: 'api-key', apiKey: 'validKey', route: 'sync' },
			});
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.eq('should have failed');
			expect(err.code).to.equal(401);
		}
	});

	it('denies invalid API-Key', async () => {
		try {
			await app.service(testRoute).find({
				authentication: { strategy: 'api-key', apiKey: 'invalidKey' },
			});
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.eq('should have failed');
			expect(err.code).to.equal(401);
		}
	});
});
