// Global hooks that run for every service
const { GeneralError } = require('@feathersjs/errors');
const { iff, isProvider } = require('feathers-hooks-common');
const { sanitizeHtml: { sanitizeDeep } } = require('./utils');


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
 * For errors without error code create GeneralError with code 500.
 * @param {context} context
 */
const errorHandler = (context) => {
	if (context.error) {
		// too much for logging...
		if (context.error.hook) {
			delete context.error.hook;
		}

		// statusCode is return by extern services / or mocks that use express res.status(myCodeNumber)
		if (!context.error.code && !context.error.statusCode) {
			context.error = new GeneralError(context.error.message || 'server error', context.error.stack || '');
		}

		return context;
	}
	context.app.logger.warning('Error with no error key is throw. Error logic can not handle it.');

	throw new GeneralError('server error');
};

function setupAppHooks(app) {
	const before = {
		all: [],
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
};
