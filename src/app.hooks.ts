// Global hooks that run for every service
import { HookContext, HookMap } from '@feathersjs/feathers';
import { Configuration } from '@hpi-schul-cloud/commons';
import Sentry from '@sentry/node';
import { Query } from 'express-serve-static-core';
import { iff, isProvider } from 'feathers-hooks-common';
import { LEAD_TIME } from '../config/globals';
import { Application } from './declarations';
import { AutoLogout, SlowQuery } from './errors';
import logger from './logger';
import utils from './utils';
import { extractDataFromJwt, getRedisClient, getRedisData, redisGetAsync, redisSetAsync } from './utils/redis';

const {
	sanitizeHtml: { sanitizeDeep },
} = utils;

const sanitizeDataHook = (context: HookContext & { safeAttributes: string[] }): HookContext => {
	if ((context.data || context.result) && context.path && context.path !== 'authentication') {
		sanitizeDeep(context.type === 'before' ? context.data : context.result, context.path, 0, context.safeAttributes);
	}
	return context;
};

const removeObjectIdInData = (context: HookContext) => {
	if (context.data && context.data._id) {
		delete context.data._id;
	}
	return context;
};

const displayInternRequests = (level) => (context: HookContext) => {
	if (context.params.provider === 'rest') {
		return context;
	}
	const { id, params, path, data, method } = context;

	if (['accounts'].includes(path) && level < 4) {
		return context;
	}
	const out: {
		id?: number | string;
		path: string;
		method: string;
		data?: unknown;
	} = {
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
const handleAutoLogout = async (context: HookContext): Promise<HookContext> => {
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
const leadTimeDetection = (context: HookContext) => {
	if (context.params.leadTime) {
		const timeDelta = Date.now() - context.params.leadTime;
		if (timeDelta >= LEAD_TIME) {
			const {
				path,
				id,
				method,
				params: { query, headers, originalUrl },
			} = context;

			const info: {
				id?: string | number;
				path: string;
				method: string;
				query: Query;
				timeDelta: number;
				originalUrl: string;
				connection?: unknown;
				requestId?: unknown;
			} = {
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

const setupAppHooks = (app: Application): void => {
	const before: HookMap = {
		all: [iff(isProvider('external'), handleAutoLogout)],
		find: [],
		get: [],
		create: [iff(isProvider('external'), sanitizeDataHook, removeObjectIdInData)],
		update: [iff(isProvider('external'), sanitizeDataHook)],
		patch: [iff(isProvider('external'), sanitizeDataHook)],
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
	if (app.get('DISPLAY_REQUEST_LEVEL') > 1 && Array.isArray(before.all)) {
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

export { handleAutoLogout, sanitizeDataHook, setupAppHooks };
