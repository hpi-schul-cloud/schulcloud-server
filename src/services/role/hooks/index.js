'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

exports.before = function(app) {
	return {
		all: [auth.hooks.authenticate('jwt')],
		find: [],
		get: [globalHooks.hasPermission('ROLE_VIEW')],
		create: [globalHooks.hasPermission('ROLE_CREATE'),
			globalHooks.resolveToIds.bind(this, '/roles', 'data.roles', 'name')
		],
		update: [globalHooks.hasPermission('ROLE_EDIT')],
		patch: [globalHooks.hasPermission('ROLE_EDIT'),globalHooks.permitGroupOperation],
		remove: [globalHooks.hasPermission('ROLE_CREATE'),globalHooks.permitGroupOperation]
	};
};

const Role = require('../model');

exports.after = {
	all: [hooks.remove('password')],
	find: [],
	get: [globalHooks.computeProperty(Role, 'getPermissions', 'permissions')],
	create: [],
	update: [],
	patch: [],
	remove: []
};
