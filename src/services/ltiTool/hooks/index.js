const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

const protectSecrets = (context) => {
	if (Array.isArray(context.result.data)) {
		let i;
		for (i = 0; i < context.result.data.length; i += 1) {
			context.result.data[i].secret = undefined;
		}
	} else {
		context.result.secret = undefined;
	}
	return context;
};

exports.before = {
	all: [authenticate('jwt')],
	find: [globalHooks.hasPermission('TOOL_VIEW')],
	get: [globalHooks.hasPermission('TOOL_VIEW')],
	create: [globalHooks.hasPermission('TOOL_CREATE')],
	update: [globalHooks.hasPermission('TOOL_EDIT')],
	patch: [globalHooks.hasPermission('TOOL_EDIT')],
	remove: [globalHooks.hasPermission('TOOL_CREATE')],
};

exports.after = {
	all: [],
	find: [globalHooks.ifNotLocal(protectSecrets)],
	get: [globalHooks.ifNotLocal(protectSecrets)],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
