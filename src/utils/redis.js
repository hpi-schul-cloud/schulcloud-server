const { promisify } = require('util');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const { GeneralError } = require('@feathersjs/errors');

let redisClient = false;

function initializeRedisClient(app) {
	const redisUrl = app.Config.data.REDIS_URI;
	if (redisUrl) {
		redisClient = redis.createClient({
			url: redisUrl,
		});
	}
}

function getRedisClient() {
	return redisClient;
}

const redisGetAsync = (...args) => {
	if (redisClient) return promisify(redisClient.get).apply(redisClient, ...args);
	throw new GeneralError('no redis connection. check for this via getRedisClient()');
};
const redisSetAsync = (...args) => {
	if (redisClient) return promisify(redisClient.set).apply(redisClient, ...args);
	throw new GeneralError('no redis connection. check for this via getRedisClient()');
};
const redisDelAsync = (...args) => {
	if (redisClient) return promisify(redisClient.del).apply(redisClient, ...args);
	throw new GeneralError('no redis connection. check for this via getRedisClient()');
};

function getRedisIdentifier(token) {
	const decodedToken = jwt.decode(token.replace('Bearer ', ''));
	const { accountId, jti } = decodedToken; // jti - UID of the token

	const redisIdentifier = `jwt:${accountId}:${jti}`;
	return redisIdentifier;
}

module.exports = {
	initializeRedisClient,
	getRedisClient,
	redisGetAsync,
	redisSetAsync,
	redisDelAsync,
	getRedisIdentifier,
};
