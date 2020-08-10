const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');

exports.before = () => ({
	all: [authenticate('jwt')],
	find: [],
	get: [globalHooks.hasPermission('ROLE_VIEW')],
	create: [
		globalHooks.hasPermission('ROLE_CREATE'),
		globalHooks.resolveToIds.bind(this, '/roles', 'data.roles', 'name'),
	],
	update: [globalHooks.hasPermission('ROLE_EDIT')],
	patch: [
		globalHooks.hasPermission('ROLE_EDIT'),
		globalHooks.permitGroupOperation,
	],
	remove: [
		globalHooks.hasPermission('ROLE_CREATE'),
		globalHooks.permitGroupOperation,
	],
});

const Role = require('../model');

exports.after = {
	all: [],
	find: [],
	get: [globalHooks.computeProperty(Role, 'getPermissions', 'permissions')],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
