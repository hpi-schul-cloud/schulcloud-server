const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

const before = {
	all: [authenticate('jwt')],
	find: [globalHooks.hasPermission('FEDERALSTATE_VIEW')],
	get: [globalHooks.hasPermission('FEDERALSTATE_VIEW')],
	create: [globalHooks.hasPermission('FEDERALSTATE_CREATE')],
	update: [globalHooks.hasPermission('FEDERALSTATE_EDIT')],
	patch: [globalHooks.hasPermission('FEDERALSTATE_EDIT'), globalHooks.permitGroupOperation],
	remove: [globalHooks.hasPermission('FEDERALSTATE_CREATE'), globalHooks.permitGroupOperation],
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
