const { promisify } = require('util');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const { MethodNotAllowed } = require('@feathersjs/errors');

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

const notAllowed = () => { throw new MethodNotAllowed('no redis connection. check for this via getRedisClient()'); };
const redisGetAsync = () => {
	if (redisClient) return promisify(redisClient.get).bind(redisClient);
	return notAllowed;
};
const redisSetAsync = () => {
	if (redisClient) return promisify(redisClient.set).bind(redisClient);
	return notAllowed;
};
const redisDelAsync = () => {
	if (redisClient) return promisify(redisClient.del).bind(redisClient);
	return notAllowed;
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
