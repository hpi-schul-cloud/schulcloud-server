const { authenticate } = require('@feathersjs/authentication');
const { preventCycle } = require('./preventCycle');
const globalHooks = require('../../../hooks');

exports.before = () => ({
	all: [authenticate('jwt')],
	find: [],
	get: [],
	create: [globalHooks.hasPermission('ROLE_CREATE'), globalHooks.resolveToIds('/roles', 'data.roles', 'name')],
	update: [globalHooks.hasPermission('ROLE_EDIT'), preventCycle],
	patch: [globalHooks.hasPermission('ROLE_EDIT'), globalHooks.permitGroupOperation, preventCycle],
	remove: [globalHooks.hasPermission('ROLE_CREATE'), globalHooks.permitGroupOperation],
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
