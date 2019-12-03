const { promisify } = require('util');
const redis = require('redis');
const jwt = require('jsonwebtoken');

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

const redisGetAsync = promisify(redisClient.get).bind(redisClient);
const redisSetAsync = promisify(redisClient.set).bind(redisClient);
const redisDelAsync = promisify(redisClient.del).bind(redisClient);

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
