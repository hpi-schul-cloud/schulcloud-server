const { promisify } = require('util');
const redis = require('redis');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { GeneralError } = require('../errors');

let redisClient = false;

async function initializeRedisClient() {
	if (Configuration.has('REDIS_URI')) {
		try {
			redisClient = redis.createClient({
				url: Configuration.get('REDIS_URI'),
				// Legacy mode is needed for compatibility with v4, see https://github.com/redis/node-redis/blob/HEAD/docs/v3-to-v4.md#legacy-mode
				legacyMode: true,
			});
			await redisClient.connect();
		} catch (err) {
			throw new GeneralError('Redis connection failed!', err);
		}
	}
}

function getRedisClient() {
	return redisClient;
}

function setRedisClient(client) {
	redisClient = client;
}

const redisGetAsync = (...args) => {
	if (redisClient) return promisify(redisClient.get).apply(redisClient, args);
	throw new GeneralError('No redis connection. Check for this via getRedisClient().');
};
const redisSetAsync = (...args) => {
	if (redisClient) return promisify(redisClient.set).apply(redisClient, args);
	throw new GeneralError('No redis connection. Check for this via getRedisClient().');
};
const redisDelAsync = (...args) => {
	if (redisClient) return promisify(redisClient.del).apply(redisClient, args);
	throw new GeneralError('No redis connection. Check for this via getRedisClient().');
};
const redisTtlAsync = (...args) => {
	if (redisClient) return promisify(redisClient.ttl).apply(redisClient, args);
	throw new GeneralError('No redis connection. Check for this via getRedisClient().');
};

module.exports = {
	initializeRedisClient,
	setRedisClient,
	getRedisClient,
	redisGetAsync,
	redisSetAsync,
	redisDelAsync,
	redisTtlAsync,
};
