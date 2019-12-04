const { TooManyRequests } = require('@feathersjs/errors');
const { discard } = require('feathers-hooks-common');
const {
	getRedisClient, redisSetAsync, redisDelAsync, getRedisIdentifier,
} = require('../../../utils/redis');

const updateUsernameForLDAP = async (context) => {
	const { schoolId, strategy } = context.data;

	if (strategy === 'ldap' && schoolId) {
		await context.app.service('schools').get(schoolId).then((school) => {
			context.data.username = `${school.ldapSchoolIdentifier}/${context.data.username}`;
		});
	}
	return context;
};

const bruteForceCheck = async (context) => {
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
				const allowedTimeDifference = process.env.LOGIN_BLOCK_TIME || 15;
				const timeDifference = (Date.now() - account.lasttriedFailedLogin) / 1000;
				if (timeDifference < allowedTimeDifference) {
					throw new TooManyRequests(
						'Brute Force Prevention!', {
							timeToWait: allowedTimeDifference - Math.ceil(timeDifference),
						},
					);
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
	// if successful login enable next login try directly
	await context.app.service('/accounts').patch(context.result.account._id, { lasttriedFailedLogin: 0 });
	return context;
};

const injectUserId = async (context) => {
	const { systemId, strategy } = context.data;

	if (strategy !== 'jwt') {
		return context.app.service('/accounts').find({
			query: {
				username: context.data.username,
				systemId,
			},
			paginate: false,
		}).then(async ([account]) => {
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
 * if a redis connection exists, the newly created is added to the whitelist.
 * @param {Object} context feathers context
 */
const addJwtToWhitelist = async (context) => {
	if (getRedisClient()) {
		const redisIdentifier = getRedisIdentifier(context.result.accessToken);
		await redisSetAsync(
			redisIdentifier, '{"IP": "NONE", "Browser": "NONE"}', 'EX', context.app.Config.data.JWT_TIMEOUT_SECONDS,
		);
	}

	return context;
};

/**
 * if a redis connection exists, the newly created is removed from the whitelist.
 * @param {Object} context feathers context
 */
const removeJwtFromWhitelist = async (context) => {
	if (getRedisClient()) {
		const redisIdentifier = getRedisIdentifier(context.params.headers.authentication);
		await redisDelAsync(redisIdentifier, '{"IP": "NONE", "Browser": "NONE"}');
	}

	return context;
};

exports.before = {
	create: [
		updateUsernameForLDAP,
		lowerCaseUsername,
		bruteForceCheck,
		injectUserId,
		removeProvider,
	],
	remove: [removeProvider],
};

exports.after = {
	all: [discard('account.password')],
	create: [bruteForceReset, addJwtToWhitelist],
	remove: [populateResult, removeJwtFromWhitelist],
};
