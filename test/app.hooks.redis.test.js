const { expect } = require('chai');
const commons = require('@hpi-schul-cloud/commons');
const whitelist = require('../src/services/authentication/logic/whitelist');
const appPromise = require('../src/app');
const testHelper = require('./services/helpers/testObjects');
const redisHelpers = require('../src/utils/redis');
const { handleAutoLogout } = require('../src/app.hooks');

const { setupNestServices, closeNestServices } = require('./utils/setup.nest.services');

const { Configuration } = commons; // separated from require, mocked in tests

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

describe('handleAutoLogout hook', () => {
	let configBefore;
	let app;
	let server;
	let nestServices;
	let testObjects;

	before(async () => {
		app = await appPromise();
		testObjects = testHelper(app);
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
		await testObjects.cleanup();

		configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
		Configuration.set('SESSION_VALKEY_URI', '//validHost:3333');
		Configuration.set('JWT_TIMEOUT_SECONDS', 7200);

		redisHelpers.clearRedis();
		const redisClientMock = new RedisClientMock();
		redisHelpers.initializeRedisClient(redisClientMock);
	});

	after(async () => {
		await testObjects.cleanup();
		redisHelpers.clearRedis();
		Configuration.reset(configBefore);
		await server.close();
		await closeNestServices(nestServices);
	});

	it('whitelisted JWT is accepted and extended', async () => {
		const user = await testObjects.createTestUser();
		const params = await testObjects.generateRequestParamsFromUser(user);
		const redisIdentifier = whitelist.createRedisIdentifierFromJwtToken(params.authentication.accessToken);

		await redisHelpers.redisSetAsync(redisIdentifier, 'value', 'EX', 1000);
		const result = await handleAutoLogout({ params });
		expect(result).to.not.equal(undefined);

		const ttl = await redisHelpers.redisTtlAsync(redisIdentifier);
		expect(ttl).to.be.greaterThan(7000);
	});

	it('not whitelisted JWT is rejected', async () => {
		const user = await testObjects.createTestUser();
		const params = await testObjects.generateRequestParamsFromUser(user);
		const redisIdentifier = whitelist.createRedisIdentifierFromJwtToken(params.authentication.accessToken);
		await redisHelpers.redisDelAsync(redisIdentifier);
		try {
			await handleAutoLogout({ params });
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(401);
			expect(err.message).to.equal('Session was expired due to inactivity - autologout.');
		}
	});

	it('passes through requests without authorisation', async () => {
		const response = await handleAutoLogout({ params: {} });
		expect(response).to.not.eq(undefined);
	});
});
