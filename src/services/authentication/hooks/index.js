const reqlib = require('app-root-path').require;

const { BruteForcePrevention } = reqlib('src/errors');
const { discard } = require('feathers-hooks-common');
const { Configuration } = require('@hpi-schul-cloud/commons');
const {
	getRedisClient,
	redisSetAsync,
	redisDelAsync,
	extractDataFromJwt,
	getRedisData,
} = require('../../../utils/redis');
const { LOGIN_BLOCK_TIME: allowedTimeDifference } = require('../../../../config/globals');
const globalHooks = require('../../../hooks');

const disabledBruteForceCheck = Configuration.get('DISABLED_BRUTE_FORCE_CHECK');

const updateUsernameForLDAP = async (context) => {
	const { schoolId, strategy } = context.data;

	if (strategy === 'ldap' && schoolId) {
		await context.app
			.service('schools')
			.get(schoolId)
			.then((school) => {
				context.data.username = `${school.ldapSchoolIdentifier}/${context.data.username}`;
			});
	}
	return context;
};

const bruteForceCheck = async (context) => {
	if (disabledBruteForceCheck) {
		return context;
	}
	const { systemId, strategy } = context.data;

	if (strategy !== 'jwt') {
		const [account] = await context.app.service('/accounts').find({
			query: {
				username: context.data.username,
				systemId,
			},
			paginate: false,
		});

		// if account doesn't exist we can not update (e.g. iserv, moodle)
		if (account) {
			if (account.lasttriedFailedLogin) {
				const timeDifference = (Date.now() - account.lasttriedFailedLogin) / 1000;
				if (timeDifference < allowedTimeDifference) {
					throw new BruteForcePrevention('Brute Force Prevention!', {
						timeToWait: allowedTimeDifference - Math.ceil(timeDifference),
					});
				}
			}
			// set current time to last tried login
			await context.app.service('/accounts').patch(account._id, { lasttriedFailedLogin: Date.now() });
		}
	}
	return context;
};

// Invalid Login will not call this function
const bruteForceReset = async (context) => {
	if (disabledBruteForceCheck) {
		return context;
	}
	// if successful login enable next login try directly
	await context.app.service('/accounts').patch(context.result.account._id, { lasttriedFailedLogin: 0 });
	return context;
};

const injectUserId = async (context) => {
	const { strategy } = context.data;
	const systemId = strategy === 'local' ? undefined : context.data.systemId;

	if (strategy !== 'jwt' && context.data.username) {
		return context.app
			.service('/accounts')
			.find({
				query: {
					username: context.data.username,
					systemId,
				},
				paginate: false,
			})
			.then(async ([account]) => {
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
						strategy,
						systemId,
					};
					const newAccount = await context.app.service('accounts').create(accountParameters);
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

const lowerCaseUsername = (hook) => {
	if (hook.data.username) {
		hook.data.username = hook.data.username.toLowerCase();
	}
	return hook;
};

const trimUsername = (hook) => {
	if (hook.data.username) {
		hook.data.username = hook.data.username.trim();
	}
	return hook;
};

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

// Requests need to be used after authentication as inner server calls
// Provider is not allowed to be set to detect it as inner server call
const removeProvider = (context) => {
	delete context.params.provider;
	return context;
};

/**
 * If a redis connection exists, the newly created is added to the whitelist.
 * @param {Object} context feathers context
 */
const addJwtToWhitelist = async (context) => {
	if (getRedisClient()) {
		const { redisIdentifier, privateDevice } = extractDataFromJwt(context.result.accessToken);
		const redisData = getRedisData({ privateDevice });
		const { expirationInSeconds } = redisData;
		// todo, do this async without await
		await redisSetAsync(redisIdentifier, JSON.stringify(redisData), 'EX', expirationInSeconds);
	}

	return context;
};

/**
 * If a redis connection exists, the newly created is removed from the whitelist.
 * @param {Object} context feathers context
 */
const removeJwtFromWhitelist = async (context) => {
	if (getRedisClient()) {
		const { redisIdentifier } = extractDataFromJwt(context.params.authentication.accessToken);
		await redisDelAsync(redisIdentifier);
	}

	return context;
};

/**
 * increase jwt timeout for private devices on request
  @param {} context
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

const hooks = {
	before: {
		create: [
			updateUsernameForLDAP,
			lowerCaseUsername,
			trimUsername,
			trimPassword,
			bruteForceCheck,
			globalHooks.blockDisposableEmail('username'),
			injectUserId,
			increaseJwtTimeoutForPrivateDevices,
			removeProvider,
		],
		remove: [removeProvider],
	},
	after: {
		all: [discard('account.password'), globalHooks.transformToDataTransferObject],
		create: [bruteForceReset, addJwtToWhitelist],
		remove: [populateResult, removeJwtFromWhitelist],
	},
};

module.exports = { hooks, removeJwtFromWhitelist, addJwtToWhitelist };
