const assert = require('assert');

const { expect } = require('chai');
const mockery = require('mockery');
const commons = require('@hpi-schul-cloud/commons');

const { Configuration } = commons;

const redisMock = require('../../../utils/redis/redisMock');

describe('jwtTimer service', () => {
	it('registered the supportJWT service', async () => {
		// eslint-disable-next-line global-require
		const defaultApp = await require('../../../../src/app');
		assert.ok(defaultApp.service('accounts/jwtTimer'));
	});
	describe('redis mocked', () => {
		let testObjects;
		let app;
		let redisHelper;
		let configBefore = null;

		describe('with redis instance', () => {
			let server;
			before(async () => {
				configBefore = Configuration.toObject({ plainSecrets: true });
				mockery.enable({
					warnOnReplace: false,
					warnOnUnregistered: false,
					useCleanCache: true,
				});
				delete require.cache[require.resolve('../../../../src/utils/redis')];
				delete require.cache[require.resolve('../../helpers/testObjects')];
				delete require.cache[require.resolve('../../../../src/services/account/services/jwtTimerService')];
				delete require.cache[require.resolve('../../../../src/app')];

				mockery.registerMock('redis', redisMock);
				mockery.registerMock('@hpi-schul-cloud/commons', commons);
				/* eslint-disable global-require */
				redisHelper = require('../../../../src/utils/redis');
				app = await require('../../../../src/app');
				testObjects = require('../../helpers/testObjects')(app);
				const { jwtTimerServiceSetup } = require('../../../../src/services/account/services/jwtTimerService');
				app.configure(jwtTimerServiceSetup);
				/* eslint-enable global-require */

				Configuration.set('REDIS_URI', '//validHost:4444');
				redisHelper.initializeRedisClient();
				server = await app.listen(0);
			});

			after(async () => {
				mockery.deregisterAll();
				mockery.disable();
				await testObjects.cleanup();
				delete require.cache[require.resolve('../../../../src/utils/redis')];
				delete require.cache[require.resolve('../../helpers/testObjects')];
				delete require.cache[require.resolve('../../../../src/services/account/services/jwtTimerService')];
				delete require.cache[require.resolve('../../../../src/app')];
				Configuration.reset(configBefore);
				await server.close();
			});

			it('FIND returns the whitelist timeToLive on the JWT that is used', async () => {
				const user = await testObjects.createTestUser();
				const params = await testObjects.generateRequestParamsFromUser(user);
				const { redisIdentifier } = redisHelper.extractRedisDataFromJwt(params.authentication.accessToken);
				await redisHelper.redisSetAsync(redisIdentifier, 'value', 'EX', 1000);

				const result = await app.service('/accounts/jwtTimer').find(params);
				expect(result.ttl).to.equal(1000);
			});

			it('CREATE resets the ttl on the jwt that is used', async () => {
				const user = await testObjects.createTestUser();
				const params = await testObjects.generateRequestParamsFromUser(user);
				const { redisIdentifier } = redisHelper.extractRedisDataFromJwt(params.authentication.accessToken);
				const ttl = Configuration.get('JWT_TIMEOUT_SECONDS');
				await redisHelper.redisSetAsync(redisIdentifier, 'value', 'EX', ttl - 5);

				await app.service('/accounts/jwtTimer').create({}, params);
				const currentTtl = await redisHelper.redisTtlAsync(redisIdentifier);
				expect(currentTtl).to.equal(ttl);
			});
		});

		describe('without redis instance', () => {
			let server;

			before(async () => {
				mockery.enable({
					warnOnReplace: false,
					warnOnUnregistered: false,
					useCleanCache: true,
				});
				mockery.registerMock('redis', redisMock);

				delete require.cache[require.resolve('../../../../src/utils/redis')];
				/* eslint-disable global-require */
				redisHelper = require('../../../../src/utils/redis');
				const { jwtTimerServiceSetup } = require('../../../../src/services/account/services/jwtTimerService');
				app = await require('../../../../src/app');
				testObjects = require('../../helpers/testObjects')(app);
				app.configure(jwtTimerServiceSetup);
				/* eslint-enable global-require */

				redisHelper.initializeRedisClient();
				server = await app.listen(0);
			});

			after(async () => {
				mockery.deregisterAll();
				mockery.disable();
				await testObjects.cleanup();
				await server.close();
			});

			it('FIND fails without redis server.', async () => {
				const user = await testObjects.createTestUser();
				const params = await testObjects.generateRequestParamsFromUser(user);
				try {
					await app.service('/accounts/jwtTimer').find(params);
					throw new Error('should have failed');
				} catch (err) {
					expect(err.message).to.not.equal('should have failed');
					expect(err.code).to.equal(405);
					expect(err.message).to.equal('This feature is disabled on this instance!');
				}
			});

			it('CREATE fails without redis server.', async () => {
				const user = await testObjects.createTestUser();
				const params = await testObjects.generateRequestParamsFromUser(user);
				try {
					await app.service('/accounts/jwtTimer').create({}, params);
					throw new Error('should have failed');
				} catch (err) {
					expect(err.message).to.not.equal('should have failed');
					expect(err.code).to.equal(405);
					expect(err.message).to.equal('This feature is disabled on this instance!');
				}
			});
		});

		after(async () => {
			await testObjects.cleanup();

			delete require.cache[require.resolve('../../../../src/utils/redis')];
			delete require.cache[require.resolve('../../../../src/app')];
			delete require.cache[require.resolve('../../helpers/testObjects')];
			delete require.cache[require.resolve('../../../../src/services/account/services/jwtTimerService')];
			Configuration.reset(configBefore);
		});
	});
});
