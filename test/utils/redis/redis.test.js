const { expect } = require('chai');
const commons = require('@hpi-schul-cloud/commons');
const redisHelpers = require('../../../src/utils/redis');

const { Configuration } = commons;

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

describe('redis helpers', () => {
	describe('without a redis server', () => {
		before(async () => {
			delete require.cache[require.resolve('../../../src/utils/redis')];
			redisHelpers.initializeRedisClient();
		});

		after(async () => {});

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
				expect(err.message).to.equal('No redis connection. Check for this via getRedisClient().');
			}
		});

		it('redisSetAsync throws an error if no client exists', async () => {
			try {
				await redisHelpers.redisSetAsync('key', 'value');
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(500);
				expect(err.message).to.equal('No redis connection. Check for this via getRedisClient().');
			}
		});

		it('redisDelAsync throws an error if no client exists', async () => {
			try {
				await redisHelpers.redisDelAsync('key', 'value');
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(500);
				expect(err.message).to.equal('No redis connection. Check for this via getRedisClient().');
			}
		});
	});

	describe('with a redis server', () => {
		let configBefore;

		before(async () => {
			configBefore = Configuration.toObject({ plainSecrets: true });
			delete require.cache[require.resolve('../../../src/utils/redis')];
			Configuration.set('REDIS_URI', '//validHost:6666');
			const redisMock = new RedisClientMock();
			redisHelpers.initializeRedisClient(redisMock);
		});

		after(async () => {
			delete require.cache[require.resolve('../../../src/utils/redis')];
			Configuration.reset(configBefore);
		});

		it('getRedisClient returns a client object', () => {
			const redisClient = redisHelpers.getRedisClient();
			expect(redisClient).to.not.equal(false);
			expect(redisClient).to.have.property('set');
			expect(redisClient).to.have.property('get');
			expect(redisClient).to.have.property('del');
		});
	});
});
