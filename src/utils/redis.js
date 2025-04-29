const Redis = require('ioredis');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { GeneralError } = require('../errors');
const logger = require('../logger');

let redisClient = false;

async function initializeRedisClient(optionalRedisInstance) {
	if (optionalRedisInstance || Configuration.has('SESSION_VALKEY_URI')) {
		try {
			redisClient = optionalRedisInstance || new Redis(Configuration.get('SESSION_VALKEY_URI'));

			// The error event must be handled, otherwise the app crashes on redis connection errors.
			// This is due to basic NodeJS behavior: https://nodejs.org/api/events.html#error-events
			redisClient.on('error', (err) => {
				logger.error('Redis client error', err);
			});
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
