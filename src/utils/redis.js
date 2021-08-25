const { promisify } = require('util');
const redis = require('redis');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { GeneralError } = require('../errors');

let redisClient = false;

function initializeRedisClient() {
	if (Configuration.has('REDIS_URI')) {
		try {
			redisClient = redis.createClient({
				url: Configuration.get('REDIS_URI'),
			});
		} catch (err) {
			throw new GeneralError('Redis connection failed!', err);
		}
	}
}

function getRedisClient() {
	return redisClient;
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
	getRedisClient,
	redisGetAsync,
	redisSetAsync,
	redisDelAsync,
	redisTtlAsync,
};
