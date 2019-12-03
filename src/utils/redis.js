const { promisify } = require('util');
const redis = require('redis');

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

module.exports = {
	getRedisClient,
	redisGetAsync,
	redisSetAsync,
	redisDelAsync,
};
