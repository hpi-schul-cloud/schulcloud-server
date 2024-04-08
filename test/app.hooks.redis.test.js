const { expect } = require('chai');
const mockery = require('mockery');
const commons = require('@hpi-schul-cloud/commons');
const redisMock = require('./utils/redis/redisMock');
const whitelist = require('../src/services/authentication/logic/whitelist');
const appPromise = require('../src/app');
const testObjects = require('./services/helpers/testObjects')(appPromise());

const { setupNestServices, closeNestServices } = require('./utils/setup.nest.services');

const { Configuration } = commons; // separated from require, mocked in tests

describe('handleAutoLogout hook', () => {
	let fut;
	let redisHelper;
	let configBefore;
	let app;
	let server;
	let nestServices;

	before(async () => {
		app = await appPromise();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);

		configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
		Configuration.set('REDIS_URI', '//validHost:3333');
		Configuration.set('JWT_TIMEOUT_SECONDS', 7200);

		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true,
		});
		mockery.registerMock('ioredis', redisMock);
		mockery.registerMock('@hpi-schul-cloud/commons', commons);

		delete require.cache[require.resolve('../src/utils/redis')];
		/* eslint-disable global-require */
		redisHelper = require('../src/utils/redis');
		fut = require('../src/app.hooks').handleAutoLogout;
		/* eslint-enable global-require */
		redisHelper.initializeRedisClient();
	});

	after(async () => {
		mockery.deregisterAll();
		mockery.disable();
		await testObjects.cleanup();
		delete require.cache[require.resolve('../src/utils/redis')];
		delete require.cache[require.resolve('../src/app')];
		delete require.cache[require.resolve('./services/helpers/testObjects')];
		delete require.cache[require.resolve('../src/app.hooks')];
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
