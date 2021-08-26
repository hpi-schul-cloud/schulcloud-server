const jwt = require('jsonwebtoken');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { BadRequest, AutoLogout } = require('../../../errors');

const { getRedisClient, redisGetAsync, redisSetAsync } = require('../../../utils/redis');

// todo extract json from string?
const getRedisData = ({ IP = 'NONE', Browser = 'NONE', Device = 'NONE', privateDevice = false }) => {
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
};

function extractRedisDataFromJwt(token) {
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
	return { accountId, jti, privateDevice };
}

const createRedisIdentifierFromJwtData = (accountId, jti) => `jwt:${accountId}:${jti}`;

const createRedisIdentifierFromJwtToken = (token) => {
	const { accountId, jti } = extractRedisDataFromJwt(token);
	const redisIdentifier = createRedisIdentifierFromJwtData(accountId, jti);
	return redisIdentifier;
};

/**
 * Routes as (regular expressions) which should be ignored for the auto-logout feature.
 */
const AUTO_LOGOUT_BLACKLIST = [/^accounts\/jwtTimer$/, /^authentication$/, /wopi\//, /roster\//];

/**
 * a path string or false when expect false
 * @param {string|boolean} path
 * @returns
 */
const isRouteWhitelisted = (path) =>
	typeof path === 'string' && AUTO_LOGOUT_BLACKLIST.some((entry) => path.match(entry));

const redisClientExists = () => !!getRedisClient();

/**
 * check for token to be a truthy value
 * @param {string} token
 * @returns
 */
const isTokenAvailable = (token) => !!token;
/**
 * when redis is enabled and the path is not whitelisted and a jwt is given, this token must be whitelisted to resume
 * @param {string|boolean} path
 * @param {string} accessToken
 * @returns
 */
const mustCheckTokenIsWhitelisted = (path) => !isRouteWhitelisted(path) && redisClientExists();

const addTokenToWhitelist = async (redisIdentifier, privateDevice = false) => {
	const redisData = getRedisData({ privateDevice });
	const { expirationInSeconds } = redisData;
	await redisSetAsync(redisIdentifier, JSON.stringify(redisData), 'EX', expirationInSeconds);
	return { ttl: expirationInSeconds };
};

const isTokenWhitelisted = async (redisIdentifier) => {
	const redisResponse = await redisGetAsync(redisIdentifier);
	return !!redisResponse;
};

/**
 * ensures jwt is whitelisted, when path is not blacklisted.
 * requires accountId and jti from jwt token to be given.
 * @param {string|boolean} path
 * @param {*} param1
 * @returns
 */
const ensureTokenIsWhitelisted = async (path, { accountId, jti, privateDevice }) => {
	if (mustCheckTokenIsWhitelisted(path)) {
		const redisIdentifier = createRedisIdentifierFromJwtData(accountId, jti);
		const redisData = getRedisData({ privateDevice });
		const { expirationInSeconds } = redisData;
		// ------------------------------------------------------------------------
		// TODO REMOVE JWT_WHITELIST_ACCEPT_ALL?
		// this is so we can ensure a fluid release without booting out all users.
		if (Configuration.get('JWT_WHITELIST_ACCEPT_ALL')) {
			await redisSetAsync(redisIdentifier, JSON.stringify(redisData), 'EX', expirationInSeconds);
			return;
		}
		// ------------------------------------------------------------------------
		const tokenIsWhitelisted = await isTokenWhitelisted(redisIdentifier);
		if (tokenIsWhitelisted) {
			// extend token expiration if token is already whitelisted
			await redisSetAsync(redisIdentifier, JSON.stringify(redisData), 'EX', expirationInSeconds);
			return;
		}
		throw new AutoLogout('Session was expired due to inactivity - autologout.');
	}
};

module.exports = {
	createRedisIdentifierFromJwtData,
	extractRedisDataFromJwt,
	createRedisIdentifierFromJwtToken,
	addTokenToWhitelist,
	ensureTokenIsWhitelisted,
	isTokenAvailable,
	getRedisData,
};
