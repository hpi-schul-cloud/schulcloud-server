'use strict';

const auth = require('feathers-authentication');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [],
	find: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SYSTEM_EDIT')],
	get: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SYSTEM_EDIT')],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
