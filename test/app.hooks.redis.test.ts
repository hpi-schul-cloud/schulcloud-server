import { expect } from 'chai';
import mockery from 'mockery';
import commons from '@hpi-schul-cloud/commons';
import redisMock from './utils/redis/redisMock';
import testObjectsImport from './services/helpers/testObjects'; 
import appPromise from '../src/app';

const { Configuration } = commons; // separated from require, mocked in tests

describe('handleAutoLogout hook', function test() {
	this.timeout(20000);

	let fut;
	let redisHelper;
	let configBefore;
	let app;
	let server;
	let testObjects;

	before(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
		Configuration.set('REDIS_URI', '//validHost:3333');
		Configuration.set('JWT_TIMEOUT_SECONDS', 7200);

		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true,
		});
		mockery.registerMock('redis', redisMock);
		mockery.registerMock('@hpi-schul-cloud/commons', commons);
		redisHelper = await import('../src/utils/redis');
		app = await appPromise;
		testObjects = testObjectsImport(app);
		const hooks = await import('../src/app.hooks');
		fut = hooks.handleAutoLogout;
		redisHelper.initializeRedisClient();
		server = await app.listen(0);
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
	});

	it('whitelisted JWT is accepted and extended', async () => {
		const user = await testObjects.createTestUser();
		const params = await testObjects.generateRequestParamsFromUser(user);
		const { redisIdentifier } = redisHelper.extractDataFromJwt(params.authentication.accessToken);
		await redisHelper.redisSetAsync(redisIdentifier, 'value', 'EX', 1000);
		const result = await fut({ params });
		expect(result).to.not.equal(undefined);
		const ttl = await redisHelper.redisTtlAsync(redisIdentifier);
		expect(ttl).to.be.greaterThan(7000);
	});

	it('not whitelisted JWT is rejected', async () => {
		const user = await testObjects.createTestUser();
		const params = await testObjects.generateRequestParamsFromUser(user);
		const { redisIdentifier } = redisHelper.extractDataFromJwt(params.authentication.accessToken);
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

	it('JWT_WHITELIST_ACCEPT_ALL can be set to not auto-logout users', async () => {
		const beforeConfigValue = Configuration.get('JWT_WHITELIST_ACCEPT_ALL');
		Configuration.set('JWT_WHITELIST_ACCEPT_ALL', true);
		const user = await testObjects.createTestUser();
		const params = await testObjects.generateRequestParamsFromUser(user);
		const { redisIdentifier } = redisHelper.extractDataFromJwt(params.authentication.accessToken);
		await redisHelper.redisDelAsync(redisIdentifier);
		const result = await fut({ params });
		expect(result).to.have.property('params');
		Configuration.set('JWT_WHITELIST_ACCEPT_ALL', beforeConfigValue);
	});

	it('passes through requests without authorisation', async () => {
		const response = await fut({ params: {} });
		expect(response).to.not.eq(undefined);
	});
});
