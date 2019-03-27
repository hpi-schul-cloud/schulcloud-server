const auth = require('feathers-authentication');
const globalHooks = require('../../../hooks');

const hooks = {
	before: {
		all: [
			auth.hooks.authenticate('jwt'),
		],
		find: [globalHooks.hasPermission('NOTIFICATION_VIEW')],
		get: [globalHooks.hasPermission('NOTIFICATION_VIEW')],
		create: [globalHooks.hasPermission('NOTIFICATION_CREATE')],
		update: [globalHooks.hasPermission('NOTIFICATION_EDIT')],
		patch: [globalHooks.hasPermission('NOTIFICATION_EDIT')],
		remove: [globalHooks.hasPermission('NOTIFICATION_CREATE')],
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

const callbackHooks = {
	before: {
		all: [],
		find: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('NOTIFICATION_VIEW')],
		// take callbacks without authentication
		get: [],
		create: [],
		update: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('NOTIFICATION_EDIT')],
		patch: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('NOTIFICATION_EDIT')],
		remove: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('NOTIFICATION_CREATE')],
	},
};

module.exports = { hooks, callbackHooks };
