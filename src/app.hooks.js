// Global hooks that run for every service
const { GeneralError, NotAuthenticated } = require('@feathersjs/errors');
const { iff, isProvider } = require('feathers-hooks-common');
const { sanitizeHtml: { sanitizeDeep } } = require('./utils');
const {
	getRedisClient, redisGetAsync, redisSetAsync, getRedisIdentifier, getRedisValue,
} = require('./utils/redis');


const sanitizeDataHook = (context) => {
	if (context.data && context.path && context.path !== 'authentication') {
		sanitizeDeep(context.data, context.path);
	}
	return context;
};

const removeObjectIdInData = (context) => {
	if (context.data && context.data._id) {
		delete context.data._id;
	}
	return context;
};

const displayInternRequests = (level) => (context) => {
	if (context.params.provider === 'rest') {
		return context;
	}
	const {
		id, params, path, data, method,
	} = context;

	if (['accounts'].includes(path) && level < 4) {
		return context;
	}
	const out = {
		path,
		method,
	};
	if (id) { out.id = id; }
	Object.keys(params).forEach((key) => {
		if (params.key) { out[key] = params.key; }
	});
	if (data) { out.data = data; }

	// eslint-disable-next-line no-console
	console.log('[intern]');
	// eslint-disable-next-line no-console
	console.log(out);
	// eslint-disable-next-line no-console
	console.log(' ');

	return context;
};

/**
 * for authenticated requests, if a redis connection is defined, check if the users jwt is whitelisted.
 * if so, the expiration timer is reset, if not the user is logged out automatically.
 * @param {Object} context feathers context
 */
const handleAutoLogout = async (context) => {
	const ignoreRoute = (context.path === 'accounts/jwtTimer');
	const redisClientExists = !!getRedisClient();
	const authorizedRequest = ((context.params || {}).authentication || {}).accessToken;
	if (!ignoreRoute && redisClientExists && authorizedRequest) {
		const redisIdentifier = getRedisIdentifier(context.params.authentication.accessToken);
		const redisResponse = await redisGetAsync(redisIdentifier);
		if (redisResponse) {
			await redisSetAsync(
				redisIdentifier, getRedisValue(), 'EX', context.app.Config.data.JWT_TIMEOUT_SECONDS,
			);
		} else {
			// ------------------------------------------------------------------------
			// this is so we can ensure a fluid release without booting out all users.
			if (context.app.Config.data.JWT_WHITELIST_ACCEPT_ALL) {
				await redisSetAsync(
					redisIdentifier, getRedisValue(),
					'EX', context.app.Config.data.JWT_TIMEOUT_SECONDS,
				);
				return context;
			}
			// ------------------------------------------------------------------------
			throw new NotAuthenticated('Session was expired due to inactivity - autologout.');
		}
	}
	return context;
};

/**
 * For errors without error code create GeneralError with code 500.
 * @param {context} context
 */
const errorHandler = (context) => {
	if (context.error) {
		if (context.error.hook) {
			// too much for logging...
			delete context.error.hook;
		}

		context.error.code = context.error.code || context.error.statusCode;
		if (!context.error.code && !context.error.type) {
			const catchedError = context.error;
			context.error = new GeneralError(context.error.message || 'Server Error', context.error.stack);
			context.error.catchedError = catchedError;
		}
		context.error.code = context.error.code || 500;
		return context;
	}
	context.app.logger.warning('Error with no error key is throw. Error logic can not handle it.');

	throw new GeneralError('server error');
};

function setupAppHooks(app) {
	const before = {
		all: [iff(isProvider('external'), handleAutoLogout)],
		find: [],
		get: [],
		create: [
			iff(isProvider('external'), [
				sanitizeDataHook, removeObjectIdInData,
			]),
		],
		update: [
			iff(isProvider('external'), [
				sanitizeDataHook,
			]),
		],
		patch: [
			iff(isProvider('external'), [
				sanitizeDataHook,
			]),
		],
		remove: [],
	};

	const after = {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	};

	const error = {
		all: [errorHandler],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	};

	// DISPLAY_REQUEST_LEVEL is set by requestLogger middleware in production it is force to 0
	// level 2+ adding intern request
	if (app.get('DISPLAY_REQUEST_LEVEL') > 1) {
		before.all.unshift(displayInternRequests(app.get('DISPLAY_REQUEST_LEVEL')));
	}
	app.hooks({ before, after, error });
}

module.exports = {
	setupAppHooks,
	sanitizeDataHook,
	handleAutoLogout,
};
