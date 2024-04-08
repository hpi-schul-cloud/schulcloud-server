const { promisify } = require('util');
const Redis = require('ioredis');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { GeneralError } = require('../errors');
const logger = require('../logger');

let redisClient = false;

async function initializeRedisClient() {
	if (Configuration.has('REDIS_URI')) {
		try {
			redisClient = new Redis(Configuration.get('REDIS_URI'));

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
