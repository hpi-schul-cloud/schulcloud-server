const errors = require('@feathersjs/errors');
const { promisify } = require('util');
const redis = require('redis');
const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
	// Connect to redis if defined
	let redisClient = false;
	const redisUrl = process.env.REDIS_URI;
	if (redisUrl) {
		redisClient = redis.createClient({
			url: redisUrl,
		});
	}
	const getAsync = promisify(redisClient.get).bind(redisClient);
	const setAsync = promisify(redisClient.set).bind(redisClient);

	// Check if jwt is available, if not let request pass
	if (redisClient && req.headers.authorization) {
		const decodedToken = jwt.decode(req.headers.authorization.replace('Bearer ', ''));
		const { accountId, jti } = decodedToken; // jti - UID of the token

		const redisIdentifier = `jwt:${accountId}:${jti}`;
		// Todo: this obviously should be in the login route...
		await setAsync(redisIdentifier, '{"IP": "NONE", "Browser": "NONE"}', 'EX', 100);

		const redisResponse = await getAsync(redisIdentifier);
		if (redisResponse) {
			// Check if JTI is in white list and still valid
			await setAsync(redisIdentifier, '{"IP": "NONE", "Browser": "NONE"}', 'EX', 100);
		} else {
			// Throw not Authenticated
			// redisClient.quit();
			next(new errors.NotAuthenticated('jwt is not whitelisted anymore - autologout'));
		}
	}

	if (redisClient) {
		redisClient.quit();
	}

	next();
};
