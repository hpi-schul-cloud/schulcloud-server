'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

exports.before = function(app) {
	return {
		all: [auth.hooks.authenticate('jwt')],
		find: [],
		get: [],
		create: [
			globalHooks.resolveToIds.bind(this, '/roles', 'data.roles', 'name')
		],
		update: [],
		patch: [],
		remove: []
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
