const { promisify } = require('util');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const { MethodNotAllowed } = require('@feathersjs/errors');

let redisClient = false;
const redisUrl = process.env.REDIS_URI;
if (redisUrl) {
	redisClient = redis.createClient({
		url: redisUrl,
	});
}

function getRedisClient() {
	return redisClient;
}

const notAllowed = () => { throw new MethodNotAllowed('no redis connection. check for this via getRedisClient()'); };
const redisGetAsync = redisClient ? promisify(redisClient.get).bind(redisClient) : notAllowed;
const redisSetAsync = redisClient ? promisify(redisClient.set).bind(redisClient) : notAllowed;
const redisDelAsync = redisClient ? promisify(redisClient.del).bind(redisClient) : notAllowed;

function getRedisIdentifier(token) {
	const decodedToken = jwt.decode(token.replace('Bearer ', ''));
	const { accountId, jti } = decodedToken; // jti - UID of the token

	const redisIdentifier = `jwt:${accountId}:${jti}`;
	return redisIdentifier;
}

module.exports = {
	getRedisClient,
	redisGetAsync,
	redisSetAsync,
	redisDelAsync,
	getRedisIdentifier,
};
