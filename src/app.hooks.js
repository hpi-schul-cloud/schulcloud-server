// Global hooks that run for every service
const { iff, isProvider } = require('feathers-hooks-common');
const { Configuration } = require('@hpi-schul-cloud/commons');
const Sentry = require('@sentry/node');

const { AutoLogout, SlowQuery } = require('./errors');
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
			throw new AutoLogout('Session was expired due to inactivity - autologout.');
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
		// By executing test over services and logging or using expect() the complet hook with all keys are printed
		delete context.error.hook;
	}
	return context;
};

// adding in this position will detect intern request to
const leadTimeDetection = (context) => {
	if (context.params.leadTime) {
		const timeDelta = Date.now() - context.params.leadTime;
		if (timeDelta >= LEAD_TIME) {
			const {
				path,
				id,
				method,
				params: { query, headers, originalUrl },
			} = context;

			const info = {
				path,
				method,
				query,
				timeDelta,
				originalUrl,
			};

			if (id) {
				info.id = id;
			}

			if (headers) {
				info.connection = headers.connection;
				info.requestId = headers.requestId;
			}
			const error = new SlowQuery(`Slow query warning at route ${context.path}`, info);
			logger.error(error);
			if (Configuration.has('SENTRY_DSN')) {
				Sentry.captureException(error);
			}
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
