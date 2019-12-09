/* eslint-disable global-require */

const { expect } = require('chai');
const mockery = require('mockery');
const redisMock = require('./redisMock');

describe('redis helpers', () => {
	describe('without a redis server', () => {
		let redisHelpers;

		before(async () => {
			mockery.enable({
				warnOnReplace: false,
				warnOnUnregistered: false,
				useCleanCache: true,
			});
			mockery.registerMock('redis', redisMock);

			delete require.cache[require.resolve('../../../src/utils/redis')];
			redisHelpers = require('../../../src/utils/redis');

			redisHelpers.initializeRedisClient({
				Config: { data: {} },
			});
		});

		after(async () => {
			mockery.deregisterAll();
			mockery.disable();
		});

		it('no redisClient is created if there is no URL', async () => {
			expect(redisHelpers.getRedisClient()).to.equal(false);
		});

		it('redisGetAsync throws an error if no client exists', async () => {
			try {
				await redisHelpers.redisGetAsync('key');
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(500);
				expect(err.message).to.equal('no redis connection. check for this via getRedisClient()');
			}
		});

		it('redisSetAsync throws an error if no client exists', async () => {
			try {
				await redisHelpers.redisSetAsync('key', 'value');
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(500);
				expect(err.message).to.equal('no redis connection. check for this via getRedisClient()');
			}
		});

		it('redisDelAsync throws an error if no client exists', async () => {
			try {
				await redisHelpers.redisDelAsync('key', 'value');
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(500);
				expect(err.message).to.equal('no redis connection. check for this via getRedisClient()');
			}
		});
	});

	/* let redisHelperWithServer;

	before(async () => {
		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true,
		});
		mockery.registerMock('redis', redisMock);
		redisHelperWithServer = require('../../../src/utils/redis');
	});

	it('creates a redisClient if an URL is given', async () => {
		redisHelperWithServer.initializeRedisClient({
			Config: { data: { REDIS_URI: '//validHost:6379' } },
		});
		expect(redisHelperWithServer.getRedisClient).to.not.equal(false);
	}); */
});
