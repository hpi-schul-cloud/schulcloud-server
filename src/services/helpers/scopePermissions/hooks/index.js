const { Forbidden, BadRequest } = require('@feathersjs/errors');

const resolveScope = (context) => {
	const scopeName = (((context.path || '').match(/^\/?(\w+)\//)) || [])[1];
	const { scopeId } = context.params.route || {};

	return { scopeName, scopeId };
};

const rejectQueryingOtherUsers = (context) => {
	if (context.params === undefined || context.params.account === undefined) {
		throw new BadRequest('Expected authentication.');
	}
	if (!['get', 'find'].includes(context.method)) {
		throw new BadRequest('Only GET and FIND methods are allowed.');
	}

	const { scopeName, scopeId } = resolveScope(context);
	let targetUserId;
	if (scopeName === 'users') {
		targetUserId = scopeId.toString();
	} else {
		if (context.method === 'get' && context.id === undefined) {
			throw new BadRequest('Expected userId.');
		}
		if (context.method === 'find' && context.params.query === undefined) {
			throw new BadRequest('Expected query for userId.');
		}
		targetUserId = context.id || context.params.query.userId;
	}

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
	const { scopeName, scopeId } = resolveScope(context);
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
	lookupScope,
	rejectQueryingOtherUsers,
};
