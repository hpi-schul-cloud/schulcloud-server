const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../../src/app');
const testHelper = require('../../helpers/testObjects');
const redisHelpers = require('../../../../src/utils/redis');
const { addJwtToWhitelist, removeJwtFromWhitelist } = require('../../../../src/services/authentication/hooks');
const whitelist = require('../../../../src/services/authentication/logic/whitelist');
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');

const valueDict = {};
const ttlDict = {};
class RedisClientMock {
	get(key) {
		const value = valueDict[key];
		return Promise.resolve(value);
	}

	set(key, value, ...args) {
		valueDict[key] = value;
		const ex = args.indexOf('EX');
		if (ex >= 0) {
			ttlDict[key] = args[ex + 1];
		}
		return Promise.resolve(true);
	}

	del(key) {
		delete valueDict[key];
		delete ttlDict[key];
		return Promise.resolve(true);
	}

	ttl(key) {
		const ttl = ttlDict[key];
		return Promise.resolve(ttl);
	}

	on(_key, _func) {}
}

describe('authentication hooks', () => {
	let configBefore = null;
	let app;
	let server;
	let nestServices;
	let testObjects;

	before(async () => {
		app = await appPromise();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
		testObjects = testHelper(app);
		await testObjects.cleanup();

		configBefore = Configuration.toObject({ plainSecrets: true });
		Configuration.set('SESSION_VALKEY_URI', '//validHost:5555');
		Configuration.set('JWT_TIMEOUT_SECONDS', 7200);
		redisHelpers.clearRedis();
		// we need clean file that no redis instance is saved from any test before
		const redisMock = new RedisClientMock();
		redisHelpers.initializeRedisClient(redisMock);
	});

	after(async () => {
		await testObjects.cleanup();
		redisHelpers.clearRedis();
		Configuration.reset(configBefore);
		await server.close();
		await closeNestServices(nestServices);
	});

	it('addJwtToWhitelist', async () => {
		const user = await testObjects.createTestUser();
		const params = await testObjects.generateRequestParamsFromUser(user);
		const { accessToken } = params.authentication;
		const redisIdentifier = whitelist.createRedisIdentifierFromJwtToken(accessToken);

		const response = await addJwtToWhitelist({ result: { accessToken } });
		expect(response.result.accessToken).to.equal(accessToken);

		const redisResult = await redisHelpers.redisGetAsync(redisIdentifier);
		expect(redisResult).to.not.equal(undefined);

		const redisTtl = await redisHelpers.redisTtlAsync(redisIdentifier);
		expect(redisTtl).to.be.greaterThan(7000);
	});

	it('removeJwtFromWhitelist', async () => {
		const user = await testObjects.createTestUser();
		const params = await testObjects.generateRequestParamsFromUser(user);
		const redisIdentifier = whitelist.createRedisIdentifierFromJwtToken(params.authentication.accessToken);
		await redisHelpers.redisSetAsync(redisIdentifier, 'value', 'EX', 7200);

		const result = await removeJwtFromWhitelist({
			params,
		});
		expect(result).to.not.equal(undefined);

		const redisResult = await redisHelpers.redisGetAsync(redisIdentifier);
		expect(redisResult).to.equal(undefined);
	});
});
