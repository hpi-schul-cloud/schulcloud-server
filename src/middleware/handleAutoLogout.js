const errors = require('@feathersjs/errors');
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

	// Check if jwt is available, if not let request pass
	if (redisClient && req.headers.authorization) {
		const decodedToken = jwt.decode(req.headers.authorization.replace('Bearer ', ''));
		const { accountId, jti } = decodedToken; // jti - UID of the token

		const redisIdentifier = `jwt:${accountId}:${jti}`;

		redisClient.on('connect', async () => {
			redisClient.get(redisIdentifier, (err, redisResponse) => {
				if (redisResponse) {
					// Check if JTI is in white list and still valid
					redisClient.set(redisIdentifier, '{"IP": "NONE", "Browser": "NONE"}', 'EX', 100);
				} else {
					// Throw not Authenticated
					redisClient.quit();
					throw new errors.NotAuthenticated('jwt is not whitelisted anymore - autologout');
				}
			});
		});

		// client.set('account:uuid', '{"jtis": [jwt:uuid:jti]}', 'EX', NEVER);
	}

	if (redisClient) {
		// redisClient.quit();
	}

	next();
};
