const { expect } = require('chai');
const commons = require('@hpi-schul-cloud/commons');

const { Configuration } = commons;
const whitelist = require('../../../../src/services/authentication/logic/whitelist');
const appPromise = require('../../../../src/app');
const testHelper = require('../../helpers/testObjects');
const redisHelpers = require('../../../../src/utils/redis');

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

describe('jwtTimer service', () => {
	describe('redis mocked', () => {
		describe('with redis instance', () => {
			let app;
			let server;
			let configBefore = null;
			let nestServices;
			let testObjects;

			before(async () => {
				app = await appPromise();
				testObjects = testHelper(app);
				server = await app.listen(0);
				nestServices = await setupNestServices(app);

				configBefore = Configuration.toObject({ plainSecrets: true });

				// eslint-disable-next-line global-require
				const { jwtTimerServiceSetup } = require('../../../../src/services/account/services/jwtTimerService');
				app.unuse('/accounts/jwtTimer');
				app.configure(jwtTimerServiceSetup);
				/* eslint-enable global-require */

				redisHelpers.clearRedis();
				Configuration.set('SESSION_VALKEY_URI', '//validHost:4444');
				const redisMock = new RedisClientMock();
				redisHelpers.initializeRedisClient(redisMock);
			});

			after(async () => {
				await testObjects.cleanup();
				delete require.cache[require.resolve('../../../../src/services/account/services/jwtTimerService')];
				redisHelpers.clearRedis();
				Configuration.reset(configBefore);
				await server.close();
				await closeNestServices(nestServices);
			});

			it('FIND returns the whitelist timeToLive on the JWT that is used', async () => {
				const user = await testObjects.createTestUser();
				const params = await testObjects.generateRequestParamsFromUser(user);
				const redisIdentifier = whitelist.createRedisIdentifierFromJwtToken(params.authentication.accessToken);
				await redisHelpers.redisSetAsync(redisIdentifier, 'value', 'EX', 1000);

				const result = await app.service('/accounts/jwtTimer').find(params);
				expect(result.ttl).to.equal(1000);
			});

			it('CREATE resets the ttl on the jwt that is used', async () => {
				const user = await testObjects.createTestUser();
				const params = await testObjects.generateRequestParamsFromUser(user);
				const redisIdentifier = whitelist.createRedisIdentifierFromJwtToken(params.authentication.accessToken);
				const ttl = Configuration.get('JWT_TIMEOUT_SECONDS');
				await redisHelpers.redisSetAsync(redisIdentifier, 'value', 'EX', ttl - 5);

				await app.service('/accounts/jwtTimer').create({}, params);
				const currentTtl = await redisHelpers.redisTtlAsync(redisIdentifier);
				expect(currentTtl).to.equal(ttl);
			});
		});

		describe('without redis instance', () => {
			let server;
			let app;
			let nestServices;
			let testObjects;

			before(async () => {
				app = await appPromise();
				testObjects = testHelper(app);
				server = await app.listen(0);
				nestServices = await setupNestServices(app);

				redisHelpers.clearRedis();

				/* eslint-disable global-require */
				const { jwtTimerServiceSetup } = require('../../../../src/services/account/services/jwtTimerService');
				app.unuse('/accounts/jwtTimer');
				app.configure(jwtTimerServiceSetup);

				redisHelpers.initializeRedisClient();
			});

			after(async () => {
				await testObjects.cleanup();
				delete require.cache[require.resolve('../../../../src/services/account/services/jwtTimerService')];
				redisHelpers.clearRedis();
				await server.close();
				await closeNestServices(nestServices);
			});

			it('FIND fails without redis server.', async () => {
				const user = await testObjects.createTestUser();
				const params = await testObjects.generateRequestParamsFromUser(user);
				try {
					await app.service('/accounts/jwtTimer').find(params);
					throw new Error('Should not fail!');
				} catch (err) {
					expect(err.message).to.not.equal('Should not fail!');
					expect(err.code).to.equal(405);
					expect(err.message).to.equal('This feature is disabled on this instance!');
				}
			});

			it('CREATE fails without redis server.', async () => {
				const user = await testObjects.createTestUser();
				const params = await testObjects.generateRequestParamsFromUser(user);
				try {
					await app.service('/accounts/jwtTimer').create({}, params);
					throw new Error('Should not fail!');
				} catch (err) {
					expect(err.message).to.not.equal('Should not fail!');
					expect(err.code).to.equal(405);
					expect(err.message).to.equal('This feature is disabled on this instance!');
				}
			});
		});
	});
});
