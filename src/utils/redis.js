const { promisify } = require('util');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const { GeneralError } = require('@feathersjs/errors');
const { Configuration } = require('@schul-cloud/commons');

let redisClient = false;

function initializeRedisClient(app) {
	if (Configuration.has('REDIS_URL')) {
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

function getRedisIdentifier(token) {
	const decodedToken = jwt.decode(token.replace('Bearer ', ''));
	const { accountId, jti } = decodedToken; // jti - UID of the token

	const redisIdentifier = `jwt:${accountId}:${jti}`;
	return redisIdentifier;
}

function getRedisValue() {
	return '{"IP": "NONE", "Browser": "NONE"}';
}

module.exports = {
	initializeRedisClient,
	getRedisClient,
	redisGetAsync,
	redisSetAsync,
	redisDelAsync,
	redisTtlAsync,
	getRedisIdentifier,
	getRedisValue,
};
