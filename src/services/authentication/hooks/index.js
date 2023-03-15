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

const disabledBruteForceCheck = Configuration.get('DISABLED_BRUTE_FORCE_CHECK');

/**
 *
 * @deprecated Remove when TSP strategy is removed
 */
const bruteForceCheck = async (context) => {
	if (disabledBruteForceCheck) {
		return context;
	}
	const { systemId, strategy } = context.data;

	if (strategy !== 'jwt') {
		await context.app.service('nest-account-uc').checkBrutForce(context.data.username, systemId);
	}
	return context;
};

/**
 *
 * @deprecated Remove when TSP strategy is removed
 */
// Invalid Login will not call this function
const bruteForceReset = async (context) => {
	if (disabledBruteForceCheck) {
		return context;
	}
	// if successful login enable next login try directly
	await context.app.service('nest-account-service').updateLastTriedFailedLogin(context.result.account._id, new Date(0));
	return context;
};

/**
 * Based on the account ID this adds user ID and system ID to the context.
 * For Moodle and iServ it creates a new Account. Neither strategy is used anymore
 *
 * @deprecated Remove when TSP strategy is removed
 */
const injectUserId = async (context) => {
	const { strategy } = context.data;
	const systemId = strategy === 'local' ? undefined : context.data.systemId;

	if (strategy !== 'jwt' && context.data.username) {
		return context.app
			.service('nest-account-service')
			.findByUsernameAndSystemId(context.data.username, systemId)
			.then(async (account) => {
				if (account) {
					context.params.payload = {};
					context.params.payload.accountId = account._id;
					if (account.userId) {
						context.params.payload.userId = account.userId;
					}
					if (account.systemId) {
						context.params.payload.systemId = account.systemId;
					}
				} else if (['moodle', 'iserv'].includes(strategy)) {
					const accountParameters = {
						username: context.data.username,
						password: context.data.password,
						systemId,
					};
					const newAccount = await context.app.service('nest-account-uc').saveAccount(accountParameters);
					context.params.payload = {};
					context.params.payload.accountId = newAccount._id;
					if (newAccount.systemId) {
						context.params.payload.systemId = newAccount.systemId;
					}
				}
				return context;
			});
	}
	return context;
};

/**
 * @deprecated Remove when TSP strategy is removed
 */
const lowerCaseUsername = (hook) => {
	if (hook.data.username) {
		hook.data.username = hook.data.username.toLowerCase();
	}
	return hook;
};

/**
 * @deprecated Remove when TSP strategy is removed
 */
const trimUsername = (hook) => {
	if (hook.data.username) {
		hook.data.username = hook.data.username.trim();
	}
	return hook;
};

/**
 * @deprecated Remove when TSP strategy is removed
 */
const trimPassword = (hook) => {
	if (hook.data.password) {
		hook.data.password = hook.data.password.trim();
	}
	return hook;
};

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
			// NOTE: is ported to nest
			lowerCaseUsername,
			// NOTE: is ported to nest
			trimUsername,
			// NOTE: is ported to nest
			trimPassword,
			// NOTE: is ported to nest
			bruteForceCheck,
			// NOTE: will not be ported to nest
			globalHooks.blockDisposableEmail('username'),
			injectUserId,
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
			// NOTE: will not be ported to nest
			bruteForceReset,
			// NOTE: is ported to nest
			addJwtToWhitelist,
		],
		remove: [populateResult, removeJwtFromWhitelist],
	},
};

module.exports = { hooks, removeJwtFromWhitelist, addJwtToWhitelist };
