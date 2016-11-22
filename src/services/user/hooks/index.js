'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication').hooks;

exports.before = {
	all: [],
	find: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated()
	],
	get: [
		/*auth.verifyToken(),
		 auth.populateUser(),
		 auth.restrictToAuthenticated()*/
	],
	create: [
		auth.hashPassword()
	],
	update: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated(),
		auth.restrictToOwner({ownerField: '_id'})
	],
	patch: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated(),
		auth.restrictToOwner({ownerField: '_id'})
	],
	remove: [
		auth.verifyToken(),
		auth.populateUser(),
		auth.restrictToAuthenticated(),
		auth.restrictToOwner({ownerField: '_id'})
	]
};

// combine permissions from all groups to an array
const resolvePermissions = (user, app) => {
	const roleService = app.service('/roles');

	return Promise.all((user.roles || []).map((roleId) => {
		return roleService.get(roleId).then((role) => {
			return role.permissions;
		});
	})).then((rolePermissions) => {
		let permissions = [];
		rolePermissions.forEach((rolePermission) => {
			permissions = permissions.concat(rolePermission || []);
		});
		return permissions;
	}).catch((err) => {
		throw new Error(err);
	});
};


exports.after = {
	all: [hooks.remove('password')],
	find: [],
	get: [
		(hook) => {
			return resolvePermissions(hook.result, hook.app).then((permissions) => {
				hook.result.permissions = permissions;
			});
		}
	],
	create: [],
	update: [],
	patch: [],
	remove: []
};
