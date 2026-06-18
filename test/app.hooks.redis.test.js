const { expect } = require('chai');
const appPromise = require('../src/app');
const testHelper = require('./services/helpers/testObjects');
const { handleAutoLogout } = require('../src/app.hooks');

const { setupNestServices, closeNestServices } = require('./utils/setup.nest.services');
const { extractJwtData } = require('../src/utils/extractJwtData');

describe('handleAutoLogout hook', () => {
	let app;
	let server;
	let nestServices;
	let testObjects;
	let jwtWhitelistAdapter;

	before(async () => {
		app = await appPromise();
		testObjects = testHelper(app);
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
		await testObjects.cleanup();
		jwtWhitelistAdapter = app.service('nest-jwt-whitelist-adapter');
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	it('whitelisted JWT is accepted and extended', async () => {
		const user = await testObjects.createTestUser();
		const params = await testObjects.generateRequestParamsFromUser(user);

		const result = await handleAutoLogout({ params, path: '/', app });
		expect(result).to.not.equal(undefined);
	});

	it('not whitelisted JWT is rejected', async () => {
		const user = await testObjects.createTestUser();
		const params = await testObjects.generateRequestParamsFromUser(user);
		const { accountId, jti } = extractJwtData(params.authentication.accessToken);

		await jwtWhitelistAdapter.removeFromWhitelist(accountId, jti);
		try {
			await handleAutoLogout({ params, path: '/', app });
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.status).to.equal(401);
			expect(err.message).to.equal('Session was expired due to inactivity - autologout.');
		}
	});

	it('passes through requests without authorisation', async () => {
		const response = await handleAutoLogout({ params: {}, app });
		expect(response).to.not.eq(undefined);
	});
});
