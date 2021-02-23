const { Forbidden, BadRequest } = require('../../../../errors');
const { resolveScope } = require('./util/resolveScope');

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

module.exports = {
	rejectQueryingOtherUsers,
};
