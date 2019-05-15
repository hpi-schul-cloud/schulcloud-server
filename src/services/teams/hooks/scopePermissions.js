const auth = require('@feathersjs/authentication');
const logger = require('winston');
const {
	Forbidden, BadRequest,
} = require('@feathersjs/errors');
const globalHooks = require('../../../hooks');

const rejectQueryingOtherUsers = (context) => {
	if (context.params === undefined || context.params.account === undefined) {
		throw new BadRequest('Expected authentication.');
	}
	if (!['get', 'find'].includes(context.method)) {
		throw new BadRequest('Only GET and FIND methods are allowed.');
	}
	if (context.method === 'get' && context.id === undefined) {
		throw new BadRequest('Expected userId.');
	}
	if (context.method === 'find' && context.params.query === undefined) {
		throw new BadRequest('Expected query for userId.');
	}
	const targetUserId = context.id || context.params.query.userId;
	const currentUserId = context.params.account.userId.toString();
	if (targetUserId === undefined || targetUserId !== currentUserId) {
		throw new Forbidden('Requested and requesting userIds do not match.');
	}
	return context;
};

const lookupScope = async (context) => {
	if (context.params === undefined || context.params.route === undefined || context.path === undefined) {
		throw new BadRequest('Missing required params.');
	}
	const scopeName = context.path.match(/^\/?(\w+)\//)[1];
	const { scopeId } = context.params.route;
	if (scopeName === undefined || scopeId === undefined) {
		throw new BadRequest('Cannot find scope name or scopeId.');
	}
	const service = context.app.service(scopeName);
	if (service === undefined) {
		throw new BadRequest(`Scope '${scopeName}' does not exist.`);
	}
	context.params.scope = await service.get(scopeId);
	return context;
};

module.exports = {
	hooks: {
		before: {
			all: [
				globalHooks.ifNotLocal(auth.hooks.authenticate('jwt')),
				globalHooks.ifNotLocal(rejectQueryingOtherUsers),
				lookupScope,
			],
			find: [],
			get: [],
		},
		after: {
			all: [],
			find: [],
			get: [],
		},
		error: {
			all: [],
			find: [],
			get: [],
		},
	},

	lookupScope,
	rejectQueryingOtherUsers,
};
