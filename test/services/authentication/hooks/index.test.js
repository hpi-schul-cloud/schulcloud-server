const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const testHelper = require('../../helpers/testObjects');
const { addJwtToWhitelist, removeJwtFromWhitelist } = require('../../../../src/services/authentication/hooks');
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');
const { extractJwtData } = require('../../../../src/utils/extractJwtData');

describe('authentication hooks', () => {
	let app;
	let server;
	let nestServices;
	let testObjects;
	let jwtWhitelistAdapter;

	before(async () => {
		app = await appPromise();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
		testObjects = testHelper(app);
		await testObjects.cleanup();
		jwtWhitelistAdapter = app.service('nest-jwt-whitelist-adapter');
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	it('addJwtToWhitelist', async () => {
		const user = await testObjects.createTestUser();
		const params = await testObjects.generateRequestParamsFromUser(user);
		const { accessToken } = params.authentication;

		const response = await addJwtToWhitelist({ result: { accessToken }, path: '/', app });
		expect(response.result.accessToken).to.equal(accessToken);

		const { accountId, jti } = extractJwtData(params.authentication.accessToken);

		const result = await jwtWhitelistAdapter.isWhitelisted(accountId, jti);
		expect(result).to.equal(undefined);

		const redisTtl = await jwtWhitelistAdapter.getTtl(accountId, jti);
		expect(redisTtl).to.be.greaterThan(1);
	});

	it('removeJwtFromWhitelist', async () => {
		const user = await testObjects.createTestUser();
		const params = await testObjects.generateRequestParamsFromUser(user);
		const { accessToken } = params.authentication;

		await addJwtToWhitelist({ result: { accessToken }, path: '/', app });
		const { accountId, jti } = extractJwtData(params.authentication.accessToken);

		const result = await removeJwtFromWhitelist({
			params,
			path: '/',
			app,
		});
		expect(result).to.not.equal(undefined);

		const jwtTtl = await jwtWhitelistAdapter.getTtl(accountId, jti);
		expect(jwtTtl).to.be.equals(-2);
	});
});
