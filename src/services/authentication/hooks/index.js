const { discard } = require('feathers-hooks-common');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { getRedisClient, redisDelAsync } = require('../../../utils/redis');
const {
	extractRedisDataFromJwt,
	createRedisIdentifierFromJwtData,
	addTokenToWhitelistWithIdAndJti,
	ensureTokenIsWhitelisted,
} = require('../logic/whitelist');

const globalHooks = require('../../../hooks');

const populateResult = (hook) => {
	hook.result.userId = hook.result.account.userId; // required by event listeners
	return hook;
};

/**
 * Requests need to be used after authentication as inner server calls
 * Provider is not allowed to be set to detect it as inner server call
 */
const removeProvider = (context) => {
	delete context.params.provider;
	return context;
};

/**
 * If a redis connection exists, the newly created is added to the whitelist.
 * @param {Object} context feathers context
 * @deprecated
 */
const addJwtToWhitelist = async (context) => {
	if (getRedisClient()) {
		const { accountId, jti, privateDevice } = extractRedisDataFromJwt(context.result.accessToken);
		await addTokenToWhitelistWithIdAndJti(accountId, jti, privateDevice);
	}

	return context;
};

/**
 * If a redis connection exists, the newly created is removed from the whitelist.
 * @param {Object} context feathers context
 */
const removeJwtFromWhitelist = async (context) => {
	if (getRedisClient()) {
		const { accountId, jti } = extractRedisDataFromJwt(context.params.authentication.accessToken);
		const redisIdentifier = createRedisIdentifierFromJwtData(accountId, jti);
		await redisDelAsync(redisIdentifier);
	}

	return context;
};

/**
 * increase jwt timeout for private devices on request
 * @deprecated remove when switched to v3 endpoint, was never in production and is more than 2 years old
 */
const increaseJwtTimeoutForPrivateDevices = (context) => {
	if (Configuration.get('FEATURE_JWT_EXTENDED_TIMEOUT_ENABLED') === true) {
		if (context.data && context.data.privateDevice === true) {
			context.params.jwt = {
				...context.params.jwt,
				privateDevice: true,
			};
		}
	}
	return context;
};

/**
 * @deprecated can be removed after switching to v3 endpoint
 */
const checkJwtAuthWhitelisted = async (context) => {
	const { strategy, accessToken } = context.data;
	if (strategy === 'jwt') {
		const { accountId, jti, privateDevice } = extractRedisDataFromJwt(accessToken);
		await ensureTokenIsWhitelisted({ accountId, jti, privateDevice });
	}
	return context;
};

const hooks = {
	before: {
		create: [
			// NOTE: is ported to nest
			checkJwtAuthWhitelisted,
			// NOTE: will not be ported to nest
			globalHooks.blockDisposableEmail('username'),
			// NOTE: will not be ported to nest
			increaseJwtTimeoutForPrivateDevices,
			// NOTE: will not be ported to nest
			removeProvider,
		],
		remove: [removeProvider],
	},
	after: {
		all: [
			// NOTE: will not be ported to nest
			discard('account.password'),
			// NOTE: will not be ported to nest
			globalHooks.transformToDataTransferObject,
		],
		create: [
			// NOTE: is ported to nest
			addJwtToWhitelist,
		],
		remove: [populateResult, removeJwtFromWhitelist],
	},
};

module.exports = { hooks, removeJwtFromWhitelist, addJwtToWhitelist };
