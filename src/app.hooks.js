// Global hooks that run for every service
const { iff, isProvider } = require('feathers-hooks-common');

const { SlowQuery } = require('./errors');
const logger = require('./logger');
const {
	sanitizeHtml: { sanitizeDeep },
} = require('./utils');
const {
	extractRedisDataFromJwt,
	isRouteWhitelisted,
	isTokenAvailable,
	ensureTokenIsWhitelisted,
} = require('./services/authentication/logic/whitelist');
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
 * for authenticated requests, if a redis connection is defined, check if the users jwt is whitelisted.
 * if so, the expiration timer is reset, if not the user is logged out automatically.
 * @param {Object} context feathers context
 */
const handleAutoLogout = async (context) => {
	const { path } = context;
	const { accessToken } = (context.params || {}).authentication || {};
	if (!isRouteWhitelisted(path) && isTokenAvailable(accessToken)) {
		const { accountId, jti, privateDevice } = extractRedisDataFromJwt(accessToken);
		await ensureTokenIsWhitelisted({ accountId, jti, privateDevice });
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
