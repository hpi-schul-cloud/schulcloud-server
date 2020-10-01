// Global hooks that run for every service
const { GeneralError, NotAuthenticated } = require('@feathersjs/errors');
const { iff, isProvider } = require('feathers-hooks-common');
const { Configuration } = require('@schul-cloud/commons');
const logger = require('./logger');
const {
	sanitizeHtml: { sanitizeDeep },
} = require('./utils');
const { getRedisClient, redisGetAsync, redisSetAsync, extractDataFromJwt, getRedisData } = require('./utils/redis');
const { LEAD_TIME } = require('../config/globals');

const sanitizeDataHook = (context) => {
	if ((context.data || context.result) && context.path && context.path !== 'authentication') {
		sanitizeDeep(context.type === 'before' ? context.data : context.result, context.path, 0, context.safeAttributes);
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
	const { id, params, path, data, method } = context;

	if (['accounts'].includes(path) && level < 4) {
		return context;
	}
	const out = {
		path,
		method,
	};
	if (id) {
		out.id = id;
	}
	Object.keys(params).forEach((key) => {
		if (params.key) {
			out[key] = params.key;
		}
	});
	if (data) {
		out.data = data;
	}

	// eslint-disable-next-line no-console
	console.log('[intern]');
	// eslint-disable-next-line no-console
	console.log(out);
	// eslint-disable-next-line no-console
	console.log(' ');

	return context;
};

/**
 * Routes as (regular expressions) which should be ignored for the auto-logout feature.
 */
const AUTO_LOGOUT_BLACKLIST = [/^accounts\/jwtTimer$/, /^authentication$/, /wopi\//, /roster\//];

/**
 * for authenticated requests, if a redis connection is defined, check if the users jwt is whitelisted.
 * if so, the expiration timer is reset, if not the user is logged out automatically.
 * @param {Object} context feathers context
 */
const handleAutoLogout = async (context) => {
	const ignoreRoute =
		typeof context.path === 'string' && AUTO_LOGOUT_BLACKLIST.some((entry) => context.path.match(entry));
	const redisClientExists = !!getRedisClient();
	const authorizedRequest = ((context.params || {}).authentication || {}).accessToken;
	if (!ignoreRoute && redisClientExists && authorizedRequest) {
		const { redisIdentifier, privateDevice } = extractDataFromJwt(context.params.authentication.accessToken);
		const redisResponse = await redisGetAsync(redisIdentifier);
		const redisData = getRedisData({ privateDevice });
		const { expirationInSeconds } = redisData;
		if (redisResponse) {
			await redisSetAsync(redisIdentifier, JSON.stringify(redisData), 'EX', expirationInSeconds);
		} else {
			// ------------------------------------------------------------------------
			// this is so we can ensure a fluid release without booting out all users.
			if (Configuration.get('JWT_WHITELIST_ACCEPT_ALL')) {
				await redisSetAsync(redisIdentifier, JSON.stringify(redisData), 'EX', expirationInSeconds);
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
		context.error.code = context.error.code || context.error.statusCode;
		if (!context.error.code && !context.error.type) {
			const catchedError = context.error;
			if (catchedError.hook) {
				// too much for logging...
				delete catchedError.hook;
			}
			context.error = new GeneralError(context.error.message || 'Server Error', context.error.stack);
			context.error.catchedError = catchedError;
		}
		context.error.code = context.error.code || 500;

		if (context.error.hook) {
			// too much for logging...
			delete context.error.hook;
		}
		return context;
	}
	context.app.logger.warning('Error with no error key is throw. Error logic can not handle it.');

	throw new GeneralError('server error');
};

// adding in this position will detect intern request to
const leadTimeDetection = (context) => {
	if (context.params.leadTime) {
		const timeDelta = Date.now() - context.params.leadTime;
		if (timeDelta >= LEAD_TIME) {
			// TODO: can replaced if we throw an error slow Query after merging new error pipline
			const {
				path,
				id,
				method,
				params: { query, headers, originalUrl },
			} = context;

			const error = {
				name: 'SlowQuery',
				message: `Slow query warning at route ${context.path}`,
				code: 408,
				path,
				method,
				query,
				timeDelta,
				originalUrl,
			};

			if (id) {
				error.id = id;
			}

			if (headers) {
				//	error.connection = headers.connection;
				error.requestId = headers.requestId;
			}
			logger.error(error);
		}
	}
};

function setupAppHooks(app) {
	const before = {
		all: [iff(isProvider('external'), handleAutoLogout)],
		find: [],
		get: [],
		create: [iff(isProvider('external'), [sanitizeDataHook, removeObjectIdInData])],
		update: [iff(isProvider('external'), [sanitizeDataHook])],
		patch: [iff(isProvider('external'), [sanitizeDataHook])],
		remove: [],
	};

	const after = {
		all: [],
		find: [iff(isProvider('external'), [sanitizeDataHook])],
		get: [iff(isProvider('external'), [sanitizeDataHook])],
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
	if (LEAD_TIME) {
		['find', 'get', 'create', 'update', 'patch', 'remove'].forEach((m) => {
			if (Array.isArray(after[m])) {
				after[m].push(leadTimeDetection);
			}
		});
	}
	app.hooks({ before, after, error });
}

module.exports = {
	handleAutoLogout,
	sanitizeDataHook,
	setupAppHooks,
};
