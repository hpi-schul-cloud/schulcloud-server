const { promisify } = require('util');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const { Configuration } = require('@hpi-schul-cloud/commons');
const reqlib = require('app-root-path').require;

const { BadRequest, GeneralError } = reqlib('src/errors');

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

function extractDataFromJwt(token) {
	const decodedToken = jwt.decode(token.replace('Bearer ', ''));
	if (decodedToken === null) {
		throw new BadRequest('Invalid authentication data');
	}
	const {
		accountId,
		/**
		 * jti - UID of the token
		 * */
		jti,
		privateDevice = false,
	} = decodedToken;
	const redisIdentifier = `jwt:${accountId}:${jti}`;
	return { redisIdentifier, privateDevice };
}

// todo extract json from string?
function getRedisData({ IP = 'NONE', Browser = 'NONE', Device = 'NONE', privateDevice = false }) {
	// set expiration longer for private devices
	let expirationInSeconds = Configuration.get('JWT_TIMEOUT_SECONDS');
	if (
		Configuration.get('FEATURE_JWT_EXTENDED_TIMEOUT_ENABLED') === true &&
		Configuration.has('JWT_EXTENDED_TIMEOUT_SECONDS') &&
		privateDevice === true
	) {
		expirationInSeconds = Configuration.get('JWT_EXTENDED_TIMEOUT_SECONDS');
	}
	return {
		IP,
		Browser,
		Device,
		privateDevice,
		expirationInSeconds,
	};
}

module.exports = {
	initializeRedisClient,
	getRedisClient,
	redisGetAsync,
	redisSetAsync,
	redisDelAsync,
	redisTtlAsync,
	extractDataFromJwt,
	getRedisData,
};
