'use strict';

const {isAdmin, ifNotLocal} = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const globalHooks = require('../../../hooks');

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SYSTEM_CREATE')],
	update: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SYSTEM_EDIT')],
	patch: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SYSTEM_EDIT')],
	remove: [auth.hooks.authenticate('jwt'), globalHooks.hasPermission('SYSTEM_CREATE')]
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
