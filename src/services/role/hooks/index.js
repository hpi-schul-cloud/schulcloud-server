const hooks = require('feathers-hooks-common');
const auth = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

console.log('test');
exports.before = {
	all: [
		auth.hooks.authenticate('jwt'),
	],
	find: [],
	get: [
		globalHooks.hasPermission('ROLE_VIEW'),
	],
	create: [
		globalHooks.hasPermission('ROLE_CREATE'),
		globalHooks.resolveToIds.bind(this, '/roles', 'data.roles', 'name'),
	],
	update: [
		globalHooks.hasPermission('ROLE_EDIT'),
	],
	patch: [
		globalHooks.hasPermission('ROLE_EDIT'),
		globalHooks.permitGroupOperation,
	],
	remove: [
		globalHooks.hasPermission('ROLE_CREATE'),
		globalHooks.permitGroupOperation,
	]
};

const Role = require('../model');

exports.after = {
	all: [
		hooks.discardQuery('password'),
	],
	find: [],
	get: [
		globalHooks.computeProperty(Role, 'getPermissions', 'permissions'),
	],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
