const { expect } = require('chai');
const commons = require('@hpi-schul-cloud/commons');
const whitelist = require('../src/services/authentication/logic/whitelist');
const appPromise = require('../src/app');
const testHelper = require('./services/helpers/testObjects');
const redisHelper = require('../src/utils/redis');
const fut = require('../src/app.hooks').handleAutoLogout;

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

		configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
		Configuration.set('REDIS_URI', '//validHost:3333');
		Configuration.set('JWT_TIMEOUT_SECONDS', 7200);

		const redisClientMock = new RedisClientMock();
		redisHelper.initializeRedisClient(redisClientMock);
	});

	after(async () => {
		await testObjects.cleanup();
		delete require.cache[require.resolve('../../../../src/utils/redis')];
		Configuration.reset(configBefore);
		await server.close();
		await closeNestServices(nestServices);
	});

	it('whitelisted JWT is accepted and extended', async () => {
		const user = await testObjects.createTestUser();
		const params = await testObjects.generateRequestParamsFromUser(user);
		const redisIdentifier = whitelist.createRedisIdentifierFromJwtToken(params.authentication.accessToken);
		await redisHelper.redisSetAsync(redisIdentifier, 'value', 'EX', 1000);
		const result = await fut({ params });
		expect(result).to.not.equal(undefined);
		const ttl = await redisHelper.redisTtlAsync(redisIdentifier);
		expect(ttl).to.be.greaterThan(7000);
	});

	it('not whitelisted JWT is rejected', async () => {
		const user = await testObjects.createTestUser();
		const params = await testObjects.generateRequestParamsFromUser(user);
		const redisIdentifier = whitelist.createRedisIdentifierFromJwtToken(params.authentication.accessToken);
		await redisHelper.redisDelAsync(redisIdentifier);
		try {
			await fut({ params });
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.equal('should have failed');
			expect(err.code).to.equal(401);
			expect(err.message).to.equal('Session was expired due to inactivity - autologout.');
		}
	});

	it('passes through requests without authorisation', async () => {
		const response = await fut({ params: {} });
		expect(response).to.not.eq(undefined);
	});
});
