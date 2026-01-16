const { Redis } = require('iovalkey');
const { GeneralError } = require('../errors');

let redisClient = false;

/**
 *
 * @param {Redis} redisInstance
 */
function initializeRedisClient(redisInstance) {
	if (redisInstance) {
		try {
			redisClient = redisInstance;
		} catch (err) {
			throw new GeneralError('Redis connection failed!', err);
		}
	}
}

function clearRedis() {
	redisClient = false;
}

function getRedisClient() {
	return redisClient;
}

function setRedisClient(client) {
	redisClient = client;
}

const redisGetAsync = (...args) => {
	if (redisClient) return redisClient.get(...args);
	throw new GeneralError('No redis connection. Check for this via getRedisClient().');
};
const redisSetAsync = (...args) => {
	if (redisClient) return redisClient.set(...args);
	throw new GeneralError('No redis connection. Check for this via getRedisClient().');
};
const redisDelAsync = (...args) => {
	if (redisClient) return redisClient.del(...args);
	throw new GeneralError('No redis connection. Check for this via getRedisClient().');
};
const redisTtlAsync = (...args) => {
	if (redisClient) return redisClient.ttl(...args);
	throw new GeneralError('No redis connection. Check for this via getRedisClient().');
};

module.exports = {
	clearRedis,
	initializeRedisClient,
	setRedisClient,
	getRedisClient,
	redisGetAsync,
	redisSetAsync,
	redisDelAsync,
	redisTtlAsync,
};
