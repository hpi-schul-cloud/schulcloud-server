const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');


exports.before = {
	all: [
		auth.hooks.authenticate('jwt'),
	],
	find: [globalHooks.hasPermission('NOTIFICATION_VIEW')],
	get: [globalHooks.hasPermission('NOTIFICATION_VIEW')],
	create: [globalHooks.hasPermission('NOTIFICATION_CREATE')],
	update: [globalHooks.hasPermission('NOTIFICATION_EDIT')],
	patch: [globalHooks.hasPermission('NOTIFICATION_EDIT')],
	remove: [globalHooks.hasPermission('NOTIFICATION_CREATE')],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};
